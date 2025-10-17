import { prisma } from '../config/database.config';
import { logger } from '../utils/logger.util';
import { appConfig } from '../config/app.config';
import { paymentService } from './payment.service';
import { v4 as uuidv4 } from 'uuid';

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  currency: string;
  duration: number; // months
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

export interface SubscriptionUsage {
  subscriptionId: string;
  month: number;
  year: number;
  eventsCreated: number;
  ticketsSold: number;
  revenue: number;
  apiCalls: number;
  webhookCalls?: number;
}

export interface SubscriptionCreateData {
  userId: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  paymentMethod: string;
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export interface SubscriptionUpgradeData {
  subscriptionId: string;
  newPlan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  paymentMethod: string;
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

class SubscriptionService {
  /**
   * Get all available subscription plans
   */
  getAvailablePlans(): SubscriptionPlan[] {
    return [
      {
        id: 'basic',
        name: 'BASIC',
        displayName: 'Basic Plan',
        price: appConfig.BASIC_PRICE,
        currency: 'EGP',
        duration: 1,
        features: {
          maxEventsPerMonth: 5,
          maxTicketsPerEvent: 1000,
          hasAnalytics: true,
          hasAdvancedAnalytics: false,
          hasCustomBranding: false,
          hasWhiteLabel: false,
          hasApiAccess: false,
          hasPrioritySupport: false,
          hasWebhookAccess: false,
          hasCustomDomain: false,
        },
        limits: {
          eventsPerMonth: 5,
          ticketsPerEvent: 1000,
          apiCallsPerMonth: 0,
          webhookCallsPerMonth: 0,
        },
      },
      {
        id: 'pro',
        name: 'PRO',
        displayName: 'Pro Plan',
        price: appConfig.PRO_PRICE,
        currency: 'EGP',
        duration: 1,
        features: {
          maxEventsPerMonth: 20,
          maxTicketsPerEvent: 5000,
          hasAnalytics: true,
          hasAdvancedAnalytics: true,
          hasCustomBranding: true,
          hasWhiteLabel: false,
          hasApiAccess: true,
          hasPrioritySupport: true,
          hasWebhookAccess: true,
          hasCustomDomain: false,
        },
        limits: {
          eventsPerMonth: 20,
          ticketsPerEvent: 5000,
          apiCallsPerMonth: 10000,
          webhookCallsPerMonth: 1000,
        },
      },
      {
        id: 'enterprise',
        name: 'ENTERPRISE',
        displayName: 'Enterprise Plan',
        price: appConfig.ENTERPRISE_PRICE,
        currency: 'EGP',
        duration: 1,
        features: {
          maxEventsPerMonth: -1, // unlimited
          maxTicketsPerEvent: -1, // unlimited
          hasAnalytics: true,
          hasAdvancedAnalytics: true,
          hasCustomBranding: true,
          hasWhiteLabel: true,
          hasApiAccess: true,
          hasPrioritySupport: true,
          hasWebhookAccess: true,
          hasCustomDomain: true,
        },
        limits: {
          eventsPerMonth: -1,
          ticketsPerEvent: -1,
          apiCallsPerMonth: -1,
          webhookCallsPerMonth: -1,
        },
      },
    ];
  }

  /**
   * Get plan details by name
   */
  getPlanByName(planName: string): SubscriptionPlan | null {
    const plans = this.getAvailablePlans();
    return plans.find(plan => plan.name === planName) || null;
  }

  /**
   * Create a new subscription
   */
  async createSubscription(data: SubscriptionCreateData): Promise<{
    success: boolean;
    subscriptionId: string;
    paymentResult?: any;
  }> {
    try {
      const plan = this.getPlanByName(data.plan);
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // Check if user already has an active subscription
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId: data.userId,
          status: {
            in: ['ACTIVE', 'PENDING'],
          },
        },
      });

      if (existingSubscription) {
        throw new Error('User already has an active subscription');
      }

      // Create subscription record
      const subscription = await prisma.subscription.create({
        data: {
          id: uuidv4(),
          userId: data.userId,
          plan: data.plan as any,
          status: 'PENDING',
          startDate: new Date(),
          endDate: new Date(Date.now() + plan.duration * 30 * 24 * 60 * 60 * 1000), // 1 month from now
          price: plan.price,
          currency: plan.currency,
          autoRenew: true,
        },
      });

      // Initiate payment for subscription
      const paymentResult = await paymentService.initiatePayment({
        eventId: 'subscription', // Special event ID for subscriptions
        ticketTypeId: `subscription-${data.plan}`,
        quantity: 1,
        amount: plan.price,
        currency: plan.currency,
        paymentMethod: data.paymentMethod,
        customerData: data.customerData,
        buyerId: data.userId,
        returnUrl: `${appConfig.FRONTEND_URL}/subscription/success`,
      });

      // Update subscription with payment details
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          paymentMethod: data.paymentMethod as any,
          transactionId: paymentResult.orderId || paymentResult.referenceNumber,
        },
      });

      logger.info(`Subscription created: ${subscription.id}`, {
        userId: data.userId,
        plan: data.plan,
        price: plan.price,
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        paymentResult,
      };
    } catch (error: any) {
      logger.error('Subscription creation failed:', error);
      throw new Error('Subscription creation failed');
    }
  }

  /**
   * Activate subscription after successful payment
   */
  async activateSubscription(subscriptionId: string): Promise<void> {
    try {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
        },
      });

      // Initialize usage tracking for current month
      await this.initializeUsageTracking(subscriptionId);

      logger.info(`Subscription activated: ${subscriptionId}`);
    } catch (error: any) {
      logger.error('Subscription activation failed:', error);
      throw new Error('Subscription activation failed');
    }
  }

  /**
   * Upgrade subscription plan
   */
  async upgradeSubscription(data: SubscriptionUpgradeData): Promise<{
    success: boolean;
    newSubscriptionId: string;
    paymentResult?: any;
  }> {
    try {
      const currentSubscription = await prisma.subscription.findUnique({
        where: { id: data.subscriptionId },
        include: { user: true },
      });

      if (!currentSubscription) {
        throw new Error('Subscription not found');
      }

      if (currentSubscription.status !== 'ACTIVE') {
        throw new Error('Only active subscriptions can be upgraded');
      }

      const newPlan = this.getPlanByName(data.newPlan);
      if (!newPlan) {
        throw new Error('Invalid subscription plan');
      }

      // Calculate prorated amount
      const remainingDays = Math.ceil((currentSubscription.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      const totalDays = 30; // Assuming monthly billing
      const proratedAmount = (newPlan.price * remainingDays) / totalDays;

      // Create new subscription record
      const newSubscription = await prisma.subscription.create({
        data: {
          id: uuidv4(),
          userId: currentSubscription.userId,
          plan: data.newPlan as any,
          status: 'PENDING',
          startDate: currentSubscription.endDate,
          endDate: new Date(currentSubscription.endDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          price: proratedAmount,
          currency: newPlan.currency,
          autoRenew: true,
        },
      });

      // Initiate payment for upgrade
      const paymentResult = await paymentService.initiatePayment({
        eventId: 'subscription-upgrade',
        ticketTypeId: `subscription-${data.newPlan}`,
        quantity: 1,
        amount: proratedAmount,
        currency: newPlan.currency,
        paymentMethod: data.paymentMethod,
        customerData: data.customerData,
        buyerId: currentSubscription.userId,
        returnUrl: `${appConfig.FRONTEND_URL}/subscription/upgrade-success`,
      });

      logger.info(`Subscription upgrade initiated: ${newSubscription.id}`, {
        from: currentSubscription.plan,
        to: data.newPlan,
        amount: proratedAmount,
      });

      return {
        success: true,
        newSubscriptionId: newSubscription.id,
        paymentResult,
      };
    } catch (error: any) {
      logger.error('Subscription upgrade failed:', error);
      throw new Error('Subscription upgrade failed');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    reason: string = 'User requested cancellation'
  ): Promise<void> {
    try {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason,
          autoRenew: false,
        },
      });

      logger.info(`Subscription cancelled: ${subscriptionId}`, { reason });
    } catch (error: any) {
      logger.error('Subscription cancellation failed:', error);
      throw new Error('Subscription cancellation failed');
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<any> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: {
            in: ['ACTIVE', 'PENDING'],
          },
        },
        include: {
          usageStats: {
            orderBy: [
              { year: 'desc' },
              { month: 'desc' },
            ],
            take: 12, // Last 12 months
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) {
        return null;
      }

      // Get plan details
      const plan = this.getPlanByName(subscription.plan);

      // Get current month usage
      const currentDate = new Date();
      const currentUsage = await this.getCurrentUsage(subscription.id);

      return {
        ...subscription,
        planDetails: plan,
        currentUsage,
        isActive: subscription.status === 'ACTIVE',
        daysRemaining: subscription.endDate ? Math.ceil((subscription.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : 0,
      };
    } catch (error: any) {
      logger.error('Get user subscription failed:', error);
      throw new Error('Get user subscription failed');
    }
  }

  /**
   * Check if user can create an event
   */
  async canCreateEvent(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    currentUsage?: any;
    limits?: any;
  }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        return {
          allowed: false,
          reason: 'No active subscription found',
        };
      }

      if (subscription.status !== 'ACTIVE') {
        return {
          allowed: false,
          reason: 'Subscription is not active',
        };
      }

      const currentUsage = await this.getCurrentUsage(subscription.id);
      const plan = this.getPlanByName(subscription.plan);

      if (!plan) {
        return {
          allowed: false,
          reason: 'Invalid subscription plan',
        };
      }

      // Check if unlimited events
      if (plan.limits.eventsPerMonth === -1) {
        return {
          allowed: true,
          currentUsage,
          limits: plan.limits,
        };
      }

      // Check monthly event limit
      if (currentUsage.eventsCreated >= plan.limits.eventsPerMonth) {
        return {
          allowed: false,
          reason: `Monthly event limit reached (${plan.limits.eventsPerMonth})`,
          currentUsage,
          limits: plan.limits,
        };
      }

      return {
        allowed: true,
        currentUsage,
        limits: plan.limits,
      };
    } catch (error: any) {
      logger.error('Check event creation permission failed:', error);
      return {
        allowed: false,
        reason: 'Error checking subscription status',
      };
    }
  }

  /**
   * Track event creation
   */
  async trackEventCreation(userId: string, eventId: string): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      await this.incrementUsage(subscription.id, 'eventsCreated', 1);
      
      logger.info(`Event creation tracked: ${eventId}`, {
        userId,
        subscriptionId: subscription.id,
      });
    } catch (error: any) {
      logger.error('Event creation tracking failed:', error);
      throw error;
    }
  }

  /**
   * Track ticket sales
   */
  async trackTicketSales(userId: string, eventId: string, ticketCount: number, revenue: number): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      await this.incrementUsage(subscription.id, 'ticketsSold', ticketCount);
      await this.incrementUsage(subscription.id, 'revenue', revenue);
      
      logger.info(`Ticket sales tracked: ${eventId}`, {
        userId,
        subscriptionId: subscription.id,
        ticketCount,
        revenue,
      });
    } catch (error: any) {
      logger.error('Ticket sales tracking failed:', error);
      throw error;
    }
  }

  /**
   * Track API usage
   */
  async trackApiUsage(userId: string, apiCalls: number = 1): Promise<{
    allowed: boolean;
    reason?: string;
    currentUsage?: any;
    limits?: any;
  }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        return {
          allowed: false,
          reason: 'No active subscription found',
        };
      }

      const currentUsage = await this.getCurrentUsage(subscription.id);
      const plan = this.getPlanByName(subscription.plan);

      if (!plan) {
        return {
          allowed: false,
          reason: 'Invalid subscription plan',
        };
      }

      // Check if unlimited API calls
      if (plan.limits.apiCallsPerMonth === -1) {
        await this.incrementUsage(subscription.id, 'apiCalls', apiCalls);
        return {
          allowed: true,
          currentUsage,
          limits: plan.limits,
        };
      }

      // Check monthly API limit
      if (currentUsage.apiCalls + apiCalls > plan.limits.apiCallsPerMonth) {
        return {
          allowed: false,
          reason: `Monthly API limit exceeded (${plan.limits.apiCallsPerMonth})`,
          currentUsage,
          limits: plan.limits,
        };
      }

      await this.incrementUsage(subscription.id, 'apiCalls', apiCalls);

      return {
        allowed: true,
        currentUsage,
        limits: plan.limits,
      };
    } catch (error: any) {
      logger.error('API usage tracking failed:', error);
      return {
        allowed: false,
        reason: 'Error tracking API usage',
      };
    }
  }

  /**
   * Get current month usage
   */
  async getCurrentUsage(subscriptionId: string): Promise<{
    eventsCreated: number;
    ticketsSold: number;
    revenue: number;
    apiCalls: number;
    webhookCalls: number;
  }> {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const usage = await prisma.subscriptionUsage.findUnique({
        where: {
          subscriptionId_month_year: {
            subscriptionId,
            month,
            year,
          },
        },
      });

      return {
        eventsCreated: usage?.eventsCreated || 0,
        ticketsSold: usage?.ticketsSold || 0,
        revenue: usage?.revenue || 0,
        apiCalls: usage?.apiCalls || 0,
        webhookCalls: 0, // TODO: Add webhook tracking
      };
    } catch (error: any) {
      logger.error('Get current usage failed:', error);
      return {
        eventsCreated: 0,
        ticketsSold: 0,
        revenue: 0,
        apiCalls: 0,
        webhookCalls: 0,
      };
    }
  }

  /**
   * Initialize usage tracking for a subscription
   */
  private async initializeUsageTracking(subscriptionId: string): Promise<void> {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      await prisma.subscriptionUsage.upsert({
        where: {
          subscriptionId_month_year: {
            subscriptionId,
            month,
            year,
          },
        },
        update: {},
        create: {
          subscriptionId,
          month,
          year,
          eventsCreated: 0,
          ticketsSold: 0,
          revenue: 0,
          apiCalls: 0,
        },
      });
    } catch (error: any) {
      logger.error('Initialize usage tracking failed:', error);
      throw error;
    }
  }

  /**
   * Increment usage for a specific metric
   */
  private async incrementUsage(
    subscriptionId: string,
    metric: 'eventsCreated' | 'ticketsSold' | 'revenue' | 'apiCalls',
    amount: number
  ): Promise<void> {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      await prisma.subscriptionUsage.upsert({
        where: {
          subscriptionId_month_year: {
            subscriptionId,
            month,
            year,
          },
        },
        update: {
          [metric]: {
            increment: amount,
          },
        },
        create: {
          subscriptionId,
          month,
          year,
          eventsCreated: metric === 'eventsCreated' ? amount : 0,
          ticketsSold: metric === 'ticketsSold' ? amount : 0,
          revenue: metric === 'revenue' ? amount : 0,
          apiCalls: metric === 'apiCalls' ? amount : 0,
        },
      });
    } catch (error: any) {
      logger.error('Increment usage failed:', error);
      throw error;
    }
  }

  /**
   * Get subscription analytics for admin
   */
  async getSubscriptionAnalytics(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    revenue: number;
    planDistribution: Record<string, number>;
    monthlyRecurringRevenue: number;
  }> {
    try {
      const [
        totalSubscriptions,
        activeSubscriptions,
        planDistribution,
      ] = await Promise.all([
        prisma.subscription.count(),
        prisma.subscription.count({
          where: { status: 'ACTIVE' },
        }),
        prisma.subscription.groupBy({
          by: ['plan'],
          _count: { plan: true },
          where: { status: 'ACTIVE' },
        }),
      ]);

      // Calculate revenue
      const revenueResult = await prisma.subscription.aggregate({
        _sum: { price: true },
        where: { status: 'ACTIVE' },
      });

      const revenue = revenueResult._sum.price || 0;

      // Calculate plan distribution
      const planDist: Record<string, number> = {};
      planDistribution.forEach(item => {
        planDist[item.plan] = item._count.plan;
      });

      return {
        totalSubscriptions,
        activeSubscriptions,
        revenue,
        planDistribution: planDist,
        monthlyRecurringRevenue: revenue,
      };
    } catch (error: any) {
      logger.error('Get subscription analytics failed:', error);
      throw new Error('Get subscription analytics failed');
    }
  }

  /**
   * Process subscription renewal
   */
  async processRenewal(subscriptionId: string): Promise<void> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.autoRenew) {
        // Extend subscription for another month
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            endDate: new Date(subscription.endDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        // Initialize usage tracking for new month
        await this.initializeUsageTracking(subscriptionId);

        logger.info(`Subscription renewed: ${subscriptionId}`);
      } else {
        // Mark as expired
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'EXPIRED' },
        });

        logger.info(`Subscription expired: ${subscriptionId}`);
      }
    } catch (error: any) {
      logger.error('Subscription renewal failed:', error);
      throw error;
    }
  }
}

export const subscriptionService = new SubscriptionService();
