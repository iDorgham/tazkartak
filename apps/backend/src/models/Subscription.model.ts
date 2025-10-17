import { PrismaClient, Subscription, SubscriptionStatus, SubscriptionPlan } from '@prisma/client';

const prisma = new PrismaClient();

export class SubscriptionModel {
  static async create(data: {
    userId: string;
    plan: SubscriptionPlan;
    price: number;
    currency?: string;
    paymentMethod?: string;
    transactionId?: string;
    autoRenew?: boolean;
  }): Promise<Subscription> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    return prisma.subscription.create({
      data: {
        ...data,
        currency: data.currency || 'EGP',
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        autoRenew: data.autoRenew ?? true,
      },
    });
  }

  static async findById(id: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            company: true,
          },
        },
        usageStats: {
          orderBy: {
            year: 'desc',
            month: 'desc',
          },
        },
      },
    });
  }

  static async findByUser(userId: string): Promise<Subscription | null> {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING],
        },
      },
      include: {
        usageStats: {
          orderBy: {
            year: 'desc',
            month: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async getAll(filters?: {
    plan?: SubscriptionPlan;
    status?: SubscriptionStatus;
    page?: number;
    limit?: number;
  }): Promise<{ subscriptions: Subscription[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      ...(filters?.plan && { plan: filters.plan }),
      ...(filters?.status && { status: filters.status }),
    };

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              company: true,
            },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    return { subscriptions, total };
  }

  static async updateStatus(id: string, status: SubscriptionStatus): Promise<Subscription> {
    return prisma.subscription.update({
      where: { id },
      data: { status },
    });
  }

  static async cancel(id: string, reason?: string): Promise<Subscription> {
    return prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
        autoRenew: false,
      },
    });
  }

  static async renew(id: string): Promise<Subscription> {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const newEndDate = new Date(subscription.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + 1);

    return prisma.subscription.update({
      where: { id },
      data: {
        startDate: subscription.endDate,
        endDate: newEndDate,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  static async getUsageStats(userId: string, year?: number, month?: number): Promise<{
    eventsCreated: number;
    ticketsSold: number;
    revenue: number;
    apiCalls: number;
    limit: {
      events: number | 'unlimited';
      apiCalls: number | 'unlimited';
    };
    usage: {
      events: number;
      apiCalls: number;
    };
    remaining: {
      events: number | 'unlimited';
      apiCalls: number | 'unlimited';
    };
  }> {
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || currentDate.getMonth() + 1;

    const subscription = await this.findByUser(userId);
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const usageStats = await prisma.subscriptionUsage.findUnique({
      where: {
        subscriptionId_month_year: {
          subscriptionId: subscription.id,
          month: targetMonth,
          year: targetYear,
        },
      },
    });

    const eventsCreated = usageStats?.eventsCreated || 0;
    const ticketsSold = usageStats?.ticketsSold || 0;
    const revenue = usageStats?.revenue || 0;
    const apiCalls = usageStats?.apiCalls || 0;

    // Get plan limits
    const planLimits = this.getPlanLimits(subscription.plan);

    return {
      eventsCreated,
      ticketsSold,
      revenue,
      apiCalls,
      limit: {
        events: planLimits.events,
        apiCalls: planLimits.apiCalls,
      },
      usage: {
        events: eventsCreated,
        apiCalls: apiCalls,
      },
      remaining: {
        events: planLimits.events === 'unlimited' ? 'unlimited' : Math.max(0, planLimits.events - eventsCreated),
        apiCalls: planLimits.apiCalls === 'unlimited' ? 'unlimited' : Math.max(0, planLimits.apiCalls - apiCalls),
      },
    };
  }

  static async incrementUsage(
    userId: string,
    type: 'events' | 'tickets' | 'revenue' | 'apiCalls',
    amount: number = 1
  ): Promise<void> {
    const subscription = await this.findByUser(userId);
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const updateData: any = {};
    switch (type) {
      case 'events':
        updateData.eventsCreated = { increment: amount };
        break;
      case 'tickets':
        updateData.ticketsSold = { increment: amount };
        break;
      case 'revenue':
        updateData.revenue = { increment: amount };
        break;
      case 'apiCalls':
        updateData.apiCalls = { increment: amount };
        break;
    }

    await prisma.subscriptionUsage.upsert({
      where: {
        subscriptionId_month_year: {
          subscriptionId: subscription.id,
          month,
          year,
        },
      },
      update: updateData,
      create: {
        subscriptionId: subscription.id,
        month,
        year,
        eventsCreated: type === 'events' ? amount : 0,
        ticketsSold: type === 'tickets' ? amount : 0,
        revenue: type === 'revenue' ? amount : 0,
        apiCalls: type === 'apiCalls' ? amount : 0,
      },
    });
  }

  static async checkUsageLimit(userId: string, type: 'events' | 'apiCalls'): Promise<boolean> {
    const usageStats = await this.getUsageStats(userId);
    const limit = usageStats.limit[type];
    const usage = usageStats.usage[type];

    if (limit === 'unlimited') {
      return true;
    }

    return usage < limit;
  }

  private static getPlanLimits(plan: SubscriptionPlan): {
    events: number | 'unlimited';
    apiCalls: number | 'unlimited';
  } {
    switch (plan) {
      case SubscriptionPlan.BASIC:
        return {
          events: 5,
          apiCalls: 1000,
        };
      case SubscriptionPlan.PRO:
        return {
          events: 20,
          apiCalls: 10000,
        };
      case SubscriptionPlan.ENTERPRISE:
        return {
          events: 'unlimited',
          apiCalls: 'unlimited',
        };
      default:
        return {
          events: 0,
          apiCalls: 0,
        };
    }
  }

  static async getExpiringSubscriptions(days: number = 7): Promise<Subscription[]> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    return prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          lte: expirationDate,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  static async getSubscriptionStats(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    revenueByPlan: Array<{ plan: SubscriptionPlan; count: number; revenue: number }>;
  }> {
    const [total, active, cancelled] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      prisma.subscription.count({
        where: { status: SubscriptionStatus.CANCELLED },
      }),
    ]);

    const revenueByPlan = await prisma.subscription.groupBy({
      by: ['plan'],
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
      _count: true,
      _sum: {
        price: true,
      },
    });

    return {
      totalSubscriptions: total,
      activeSubscriptions: active,
      cancelledSubscriptions: cancelled,
      revenueByPlan: revenueByPlan.map(item => ({
        plan: item.plan,
        count: item._count,
        revenue: item._sum.price || 0,
      })),
    };
  }
}

