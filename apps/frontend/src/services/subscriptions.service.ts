import { api } from './api.service';

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  currency: string;
  duration: number;
  features: {
    maxEventsPerMonth: number;
    maxTicketsPerEvent: number;
    hasAnalytics: boolean;
    hasAdvancedAnalytics: boolean;
    hasCustomBranding: boolean;
    hasWhiteLabel: boolean;
    hasApiAccess: boolean;
    hasPrioritySupport: boolean;
    hasWebhookAccess: boolean;
    hasCustomDomain: boolean;
  };
  limits: {
    eventsPerMonth: number;
    ticketsPerEvent: number;
    apiCallsPerMonth: number;
    webhookCallsPerMonth: number;
  };
}

export interface UserSubscription {
  id: string;
  userId: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
  autoRenew: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  planDetails?: SubscriptionPlan;
  currentUsage?: {
    eventsCreated: number;
    ticketsSold: number;
    revenue: number;
    apiCalls: number;
    webhookCalls: number;
  };
  isActive: boolean;
  daysRemaining: number;
}

export interface SubscriptionCreateData {
  plan: string;
  paymentMethod: string;
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export interface SubscriptionUpgradeData {
  newPlan: string;
  paymentMethod: string;
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export interface EventCreationPermission {
  allowed: boolean;
  reason?: string;
  currentUsage?: {
    eventsCreated: number;
    ticketsSold: number;
    revenue: number;
    apiCalls: number;
    webhookCalls: number;
  };
  limits?: {
    eventsPerMonth: number;
    ticketsPerEvent: number;
    apiCallsPerMonth: number;
    webhookCallsPerMonth: number;
  };
}

export interface ApiUsagePermission {
  allowed: boolean;
  reason?: string;
  currentUsage?: {
    eventsCreated: number;
    ticketsSold: number;
    revenue: number;
    apiCalls: number;
    webhookCalls: number;
  };
  limits?: {
    eventsPerMonth: number;
    ticketsPerEvent: number;
    apiCallsPerMonth: number;
    webhookCallsPerMonth: number;
  };
}

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  revenue: number;
  planDistribution: Record<string, number>;
  monthlyRecurringRevenue: number;
}

class SubscriptionsService {
  /**
   * Get available subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await api.get('/subscriptions/plans');
    return response.data.data;
  }

  /**
   * Get user's current subscription
   */
  async getCurrentSubscription(): Promise<UserSubscription | null> {
    const response = await api.get('/subscriptions/current');
    return response.data.data;
  }

  /**
   * Create new subscription
   */
  async createSubscription(data: SubscriptionCreateData): Promise<{
    success: boolean;
    subscriptionId: string;
    paymentResult?: any;
  }> {
    const response = await api.post('/subscriptions/create', data);
    return response.data.data;
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(subscriptionId: string, data: SubscriptionUpgradeData): Promise<{
    success: boolean;
    newSubscriptionId: string;
    paymentResult?: any;
  }> {
    const response = await api.post(`/subscriptions/upgrade/${subscriptionId}`, data);
    return response.data.data;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<{ message: string }> {
    const response = await api.post(`/subscriptions/cancel/${subscriptionId}`, { reason });
    return response.data;
  }

  /**
   * Check event creation permission
   */
  async checkEventCreationPermission(): Promise<EventCreationPermission> {
    const response = await api.get('/subscriptions/permissions/event-creation');
    return response.data.data;
  }

  /**
   * Get current usage
   */
  async getCurrentUsage(): Promise<{
    eventsCreated: number;
    ticketsSold: number;
    revenue: number;
    apiCalls: number;
    webhookCalls: number;
    limits?: {
      eventsPerMonth: number;
      ticketsPerEvent: number;
      apiCallsPerMonth: number;
      webhookCallsPerMonth: number;
    };
  }> {
    const response = await api.get('/subscriptions/usage');
    return response.data.data;
  }

  /**
   * Track event creation
   */
  async trackEventCreation(eventId: string): Promise<{ message: string }> {
    const response = await api.post('/subscriptions/track/event-creation', { eventId });
    return response.data;
  }

  /**
   * Track ticket sales
   */
  async trackTicketSales(eventId: string, ticketCount: number, revenue: number): Promise<{ message: string }> {
    const response = await api.post('/subscriptions/track/ticket-sales', {
      eventId,
      ticketCount,
      revenue,
    });
    return response.data;
  }

  /**
   * Track API usage
   */
  async trackApiUsage(apiCalls: number = 1): Promise<ApiUsagePermission> {
    const response = await api.post('/subscriptions/track/api-usage', { apiCalls });
    return response.data.data;
  }

  /**
   * Get subscription analytics (Admin only)
   */
  async getSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
    const response = await api.get('/subscriptions/analytics');
    return response.data.data;
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'EGP'): string {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Get plan features list
   */
  getPlanFeatures(plan: SubscriptionPlan): Array<{
    name: string;
    included: boolean;
    limit?: string;
  }> {
    return [
      {
        name: 'Events per month',
        included: true,
        limit: plan.limits.eventsPerMonth === -1 ? 'Unlimited' : plan.limits.eventsPerMonth.toString(),
      },
      {
        name: 'Tickets per event',
        included: true,
        limit: plan.limits.ticketsPerEvent === -1 ? 'Unlimited' : plan.limits.ticketsPerEvent.toString(),
      },
      {
        name: 'Basic Analytics',
        included: plan.features.hasAnalytics,
      },
      {
        name: 'Advanced Analytics',
        included: plan.features.hasAdvancedAnalytics,
      },
      {
        name: 'Custom Branding',
        included: plan.features.hasCustomBranding,
      },
      {
        name: 'API Access',
        included: plan.features.hasApiAccess,
        limit: plan.limits.apiCallsPerMonth === -1 ? 'Unlimited' : `${plan.limits.apiCallsPerMonth.toLocaleString()} calls/month`,
      },
      {
        name: 'Webhook Access',
        included: plan.features.hasWebhookAccess,
      },
      {
        name: 'Priority Support',
        included: plan.features.hasPrioritySupport,
      },
      {
        name: 'White Label',
        included: plan.features.hasWhiteLabel,
      },
      {
        name: 'Custom Domain',
        included: plan.features.hasCustomDomain,
      },
    ];
  }

  /**
   * Get plan comparison data
   */
  getPlanComparison(plans: SubscriptionPlan[]): Array<{
    feature: string;
    basic: string | boolean;
    pro: string | boolean;
    enterprise: string | boolean;
  }> {
    const basicPlan = plans.find(p => p.name === 'BASIC');
    const proPlan = plans.find(p => p.name === 'PRO');
    const enterprisePlan = plans.find(p => p.name === 'ENTERPRISE');

    return [
      {
        feature: 'Monthly Price',
        basic: basicPlan ? this.formatCurrency(basicPlan.price) : 'N/A',
        pro: proPlan ? this.formatCurrency(proPlan.price) : 'N/A',
        enterprise: enterprisePlan ? this.formatCurrency(enterprisePlan.price) : 'N/A',
      },
      {
        feature: 'Events per Month',
        basic: basicPlan?.limits.eventsPerMonth === -1 ? 'Unlimited' : basicPlan?.limits.eventsPerMonth.toString() || 'N/A',
        pro: proPlan?.limits.eventsPerMonth === -1 ? 'Unlimited' : proPlan?.limits.eventsPerMonth.toString() || 'N/A',
        enterprise: enterprisePlan?.limits.eventsPerMonth === -1 ? 'Unlimited' : enterprisePlan?.limits.eventsPerMonth.toString() || 'N/A',
      },
      {
        feature: 'Tickets per Event',
        basic: basicPlan?.limits.ticketsPerEvent === -1 ? 'Unlimited' : basicPlan?.limits.ticketsPerEvent.toString() || 'N/A',
        pro: proPlan?.limits.ticketsPerEvent === -1 ? 'Unlimited' : proPlan?.limits.ticketsPerEvent.toString() || 'N/A',
        enterprise: enterprisePlan?.limits.ticketsPerEvent === -1 ? 'Unlimited' : enterprisePlan?.limits.ticketsPerEvent.toString() || 'N/A',
      },
      {
        feature: 'Basic Analytics',
        basic: basicPlan?.features.hasAnalytics || false,
        pro: proPlan?.features.hasAnalytics || false,
        enterprise: enterprisePlan?.features.hasAnalytics || false,
      },
      {
        feature: 'Advanced Analytics',
        basic: basicPlan?.features.hasAdvancedAnalytics || false,
        pro: proPlan?.features.hasAdvancedAnalytics || false,
        enterprise: enterprisePlan?.features.hasAdvancedAnalytics || false,
      },
      {
        feature: 'Custom Branding',
        basic: basicPlan?.features.hasCustomBranding || false,
        pro: proPlan?.features.hasCustomBranding || false,
        enterprise: enterprisePlan?.features.hasCustomBranding || false,
      },
      {
        feature: 'API Access',
        basic: basicPlan?.features.hasApiAccess || false,
        pro: proPlan?.features.hasApiAccess || false,
        enterprise: enterprisePlan?.features.hasApiAccess || false,
      },
      {
        feature: 'Webhook Access',
        basic: basicPlan?.features.hasWebhookAccess || false,
        pro: proPlan?.features.hasWebhookAccess || false,
        enterprise: enterprisePlan?.features.hasWebhookAccess || false,
      },
      {
        feature: 'Priority Support',
        basic: basicPlan?.features.hasPrioritySupport || false,
        pro: proPlan?.features.hasPrioritySupport || false,
        enterprise: enterprisePlan?.features.hasPrioritySupport || false,
      },
      {
        feature: 'White Label',
        basic: basicPlan?.features.hasWhiteLabel || false,
        pro: proPlan?.features.hasWhiteLabel || false,
        enterprise: enterprisePlan?.features.hasWhiteLabel || false,
      },
      {
        feature: 'Custom Domain',
        basic: basicPlan?.features.hasCustomDomain || false,
        pro: proPlan?.features.hasCustomDomain || false,
        enterprise: enterprisePlan?.features.hasCustomDomain || false,
      },
    ];
  }

  /**
   * Calculate usage percentage
   */
  calculateUsagePercentage(current: number, limit: number): number {
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100; // No limit but has usage
    return Math.min((current / limit) * 100, 100);
  }

  /**
   * Get usage status color
   */
  getUsageStatusColor(percentage: number): 'success' | 'warning' | 'error' {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'error';
  }

  /**
   * Check if plan upgrade is available
   */
  canUpgradeTo(currentPlan: string, targetPlan: string): boolean {
    const planHierarchy = ['BASIC', 'PRO', 'ENTERPRISE'];
    const currentIndex = planHierarchy.indexOf(currentPlan);
    const targetIndex = planHierarchy.indexOf(targetPlan);
    
    return targetIndex > currentIndex;
  }

  /**
   * Get recommended plan based on usage
   */
  getRecommendedPlan(usage: {
    eventsCreated: number;
    apiCalls: number;
  }): string {
    if (usage.eventsCreated > 15 || usage.apiCalls > 8000) {
      return 'ENTERPRISE';
    } else if (usage.eventsCreated > 3 || usage.apiCalls > 1000) {
      return 'PRO';
    } else {
      return 'BASIC';
    }
  }

  /**
   * Format plan name for display
   */
  formatPlanName(planName: string): string {
    const planNames: Record<string, string> = {
      'BASIC': 'Basic',
      'PRO': 'Pro',
      'ENTERPRISE': 'Enterprise',
    };
    return planNames[planName] || planName;
  }

  /**
   * Get plan icon
   */
  getPlanIcon(planName: string): string {
    const icons: Record<string, string> = {
      'BASIC': '⭐',
      'PRO': '🚀',
      'ENTERPRISE': '👑',
    };
    return icons[planName] || '📦';
  }
}

export const subscriptionsService = new SubscriptionsService();
