import { PrismaClient, Payment, PaymentStatus, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

export class PaymentModel {
  static async create(data: {
    ticketId: string;
    buyerId: string;
    amount: number;
    currency?: string;
    method: PaymentMethod;
    transactionId?: string;
    referenceNumber?: string;
    paymentUrl?: string;
  }): Promise<Payment> {
    return prisma.payment.create({
      data: {
        ...data,
        currency: data.currency || 'EGP',
        status: PaymentStatus.PENDING,
      },
    });
  }

  static async findById(id: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        ticket: {
          include: {
            event: true,
            buyer: true,
          },
        },
        buyer: true,
      },
    });
  }

  static async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return prisma.payment.findFirst({
      where: { transactionId },
      include: {
        ticket: {
          include: {
            event: true,
            buyer: true,
          },
        },
        buyer: true,
      },
    });
  }

  static async findByReferenceNumber(referenceNumber: string): Promise<Payment | null> {
    return prisma.payment.findFirst({
      where: { referenceNumber },
      include: {
        ticket: {
          include: {
            event: true,
            buyer: true,
          },
        },
        buyer: true,
      },
    });
  }

  static async getAll(filters?: {
    status?: PaymentStatus;
    method?: PaymentMethod;
    buyerId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ payments: Payment[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.method && { method: filters.method }),
      ...(filters?.buyerId && { buyerId: filters.buyerId }),
    };

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ticket: {
            include: {
              event: {
                select: {
                  name: true,
                  startDate: true,
                },
              },
            },
          },
          buyer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  }

  static async updateStatus(id: string, status: PaymentStatus, gatewayResponse?: any): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data: {
        status,
        gatewayResponse,
        processedAt: status === PaymentStatus.COMPLETED ? new Date() : undefined,
      },
    });
  }

  static async processRefund(id: string, refundAmount: number, reason?: string): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data: {
        refundAmount,
        refundReason: reason,
        refundDate: new Date(),
        status: PaymentStatus.REFUNDED,
      },
    });
  }

  static async getPaymentStats(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    method?: PaymentMethod;
  }): Promise<{
    totalAmount: number;
    totalTransactions: number;
    successRate: number;
    refundAmount: number;
    refundCount: number;
  }> {
    const where: any = {};

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters?.method) {
      where.method = filters.method;
    }

    const [totalStats, refundStats] = await Promise.all([
      prisma.payment.aggregate({
        where,
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          ...where,
          status: PaymentStatus.REFUNDED,
        },
        _sum: {
          refundAmount: true,
        },
        _count: true,
      }),
    ]);

    const successfulPayments = await prisma.payment.count({
      where: {
        ...where,
        status: PaymentStatus.COMPLETED,
      },
    });

    return {
      totalAmount: totalStats._sum.amount || 0,
      totalTransactions: totalStats._count,
      successRate: totalStats._count > 0 ? (successfulPayments / totalStats._count) * 100 : 0,
      refundAmount: refundStats._sum.refundAmount || 0,
      refundCount: refundStats._count,
    };
  }

  static async getRevenueByMonth(year: number): Promise<Array<{ month: number; revenue: number }>> {
    const payments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    const monthlyRevenue: { [key: number]: number } = {};

    payments.forEach(payment => {
      const month = payment.createdAt.getMonth() + 1;
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + payment.amount;
    });

    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: monthlyRevenue[i + 1] || 0,
    }));
  }
}

