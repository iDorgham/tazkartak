import { Prisma, UserRole, EventStatus, PaymentStatus, TicketStatus } from '@prisma/client';
import prisma from '../config/database.config';
import { logger } from '../utils/logger.util';
import { CustomError } from '../middleware/errorHandler.middleware';

export interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  totalVenues: number;
  totalRevenue: number;
  totalTicketsSold: number;
  activeEvents: number;
  pendingEvents: number;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    joinDate: Date;
  }>;
  recentEvents: Array<{
    id: string;
    name: string;
    organizer: string;
    date: Date;
    attendees: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
  userGrowthByMonth: Array<{
    month: string;
    users: number;
  }>;
}

export interface EventAnalytics {
  eventId: string;
  eventName: string;
  totalViews: number;
  uniqueViews: number;
  ticketsSold: number;
  totalRevenue: number;
  conversionRate: number;
  averageTicketPrice: number;
  salesByDay: Array<{
    date: string;
    ticketsSold: number;
    revenue: number;
  }>;
  ticketTypeStats: Array<{
    name: string;
    total: number;
    sold: number;
    revenue: number;
  }>;
  refunds: number;
  refundAmount: number;
  qrScans: number;
  uniqueScans: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
  revenueByEvent: Array<{
    eventId: string;
    eventName: string;
    revenue: number;
    ticketsSold: number;
  }>;
  revenueByPaymentMethod: Array<{
    method: string;
    revenue: number;
    count: number;
  }>;
  refunds: {
    total: number;
    amount: number;
    byMonth: Array<{
      month: string;
      amount: number;
    }>;
  };
}

export interface UserAnalytics {
  totalUsers: number;
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
  usersByStatus: Array<{
    status: string;
    count: number;
  }>;
  userGrowthByMonth: Array<{
    month: string;
    users: number;
  }>;
  activeUsers: number;
  newUsersThisMonth: number;
  userRetention: {
    day1: number;
    day7: number;
    day30: number;
  };
}

export interface TicketAnalytics {
  totalTickets: number;
  soldTickets: number;
  usedTickets: number;
  refundedTickets: number;
  availableTickets: number;
  totalRevenue: number;
  averageTicketPrice: number;
  ticketsByStatus: Array<{
    status: string;
    count: number;
  }>;
  salesByDay: Array<{
    date: string;
    ticketsSold: number;
    revenue: number;
  }>;
  topEvents: Array<{
    eventId: string;
    eventName: string;
    ticketsSold: number;
    revenue: number;
  }>;
}

export interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  eventId?: string;
  userId?: string;
}

export class AnalyticsService {
  /**
   * Get admin dashboard statistics
   */
  static async getAdminDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        totalUsers,
        totalEvents,
        totalVenues,
        totalRevenue,
        totalTicketsSold,
        activeEvents,
        pendingEvents,
        recentUsers,
        recentEvents
      ] = await Promise.all([
        prisma.user.count(),
        prisma.event.count(),
        prisma.venue.count(),
        prisma.payment.aggregate({
          where: { status: PaymentStatus.COMPLETED },
          _sum: { amount: true }
        }),
        prisma.ticket.count({
          where: { status: { in: [TicketStatus.SOLD, TicketStatus.USED] } }
        }),
        prisma.event.count({ where: { status: EventStatus.PUBLISHED } }),
        prisma.event.count({ where: { status: EventStatus.DRAFT } }),
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true
          }
        }),
        prisma.event.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            organizer: {
              select: {
                name: true
              }
            },
            _count: {
              select: { tickets: true }
            }
          }
        })
      ]);

      // Get revenue by month for last 12 months
      const revenueByMonth = await this.getRevenueByMonth();
      
      // Get user growth by month for last 12 months
      const userGrowthByMonth = await this.getUserGrowthByMonth();

      return {
        totalUsers,
        totalEvents,
        totalVenues,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalTicketsSold,
        activeEvents,
        pendingEvents,
        recentUsers: recentUsers.map(user => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          joinDate: user.createdAt
        })),
        recentEvents: recentEvents.map(event => ({
          id: event.id,
          name: event.name,
          organizer: event.organizer.name,
          date: event.startDate,
          attendees: event._count.tickets
        })),
        revenueByMonth,
        userGrowthByMonth
      };
    } catch (error: any) {
      logger.error('Failed to get admin dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get organizer dashboard statistics
   */
  static async getOrganizerDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      // Get organizer
      const organizer = await prisma.organizer.findUnique({
        where: { userId }
      });

      if (!organizer) {
        throw new CustomError('Organizer not found', 404);
      }

      const [
        totalEvents,
        totalRevenue,
        totalTicketsSold,
        activeEvents,
        pendingEvents,
        recentEvents
      ] = await Promise.all([
        prisma.event.count({ where: { organizerId: organizer.id } }),
        prisma.payment.aggregate({
          where: {
            status: PaymentStatus.COMPLETED,
            ticket: {
              event: { organizerId: organizer.id }
            }
          },
          _sum: { amount: true }
        }),
        prisma.ticket.count({
          where: {
            status: { in: [TicketStatus.SOLD, TicketStatus.USED] },
            event: { organizerId: organizer.id }
          }
        }),
        prisma.event.count({
          where: { organizerId: organizer.id, status: EventStatus.PUBLISHED }
        }),
        prisma.event.count({
          where: { organizerId: organizer.id, status: EventStatus.DRAFT }
        }),
        prisma.event.findMany({
          where: { organizerId: organizer.id },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { tickets: true }
            }
          }
        })
      ]);

      // Get revenue by month for organizer
      const revenueByMonth = await this.getOrganizerRevenueByMonth(organizer.id);

      return {
        totalUsers: 0, // Not relevant for organizer
        totalEvents,
        totalVenues: 0, // Not relevant for organizer
        totalRevenue: totalRevenue._sum.amount || 0,
        totalTicketsSold,
        activeEvents,
        pendingEvents,
        recentUsers: [], // Not relevant for organizer
        recentEvents: recentEvents.map(event => ({
          id: event.id,
          name: event.name,
          organizer: organizer.name,
          date: event.startDate,
          attendees: event._count.tickets
        })),
        revenueByMonth,
        userGrowthByMonth: [] // Not relevant for organizer
      };
    } catch (error: any) {
      logger.error('Failed to get organizer dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get venue dashboard statistics
   */
  static async getVenueDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      // Get venue owner
      const venueOwner = await prisma.venueOwner.findUnique({
        where: { userId }
      });

      if (!venueOwner) {
        throw new CustomError('Venue owner not found', 404);
      }

      const [
        totalVenues,
        totalEvents,
        totalRevenue,
        totalTicketsSold,
        activeEvents,
        recentEvents
      ] = await Promise.all([
        prisma.venue.count({ where: { ownerId: venueOwner.id } }),
        prisma.event.count({
          where: { venue: { ownerId: venueOwner.id } }
        }),
        prisma.payment.aggregate({
          where: {
            status: PaymentStatus.COMPLETED,
            ticket: {
              event: { venue: { ownerId: venueOwner.id } }
            }
          },
          _sum: { amount: true }
        }),
        prisma.ticket.count({
          where: {
            status: { in: [TicketStatus.SOLD, TicketStatus.USED] },
            event: { venue: { ownerId: venueOwner.id } }
          }
        }),
        prisma.event.count({
          where: {
            venue: { ownerId: venueOwner.id },
            status: EventStatus.PUBLISHED
          }
        }),
        prisma.event.findMany({
          where: { venue: { ownerId: venueOwner.id } },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            organizer: {
              select: { name: true }
            },
            _count: {
              select: { tickets: true }
            }
          }
        })
      ]);

      // Get revenue by month for venue
      const revenueByMonth = await this.getVenueRevenueByMonth(venueOwner.id);

      return {
        totalUsers: 0, // Not relevant for venue
        totalEvents,
        totalVenues,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalTicketsSold,
        activeEvents,
        pendingEvents: 0, // Not relevant for venue
        recentUsers: [], // Not relevant for venue
        recentEvents: recentEvents.map(event => ({
          id: event.id,
          name: event.name,
          organizer: event.organizer.name,
          date: event.startDate,
          attendees: event._count.tickets
        })),
        revenueByMonth,
        userGrowthByMonth: [] // Not relevant for venue
      };
    } catch (error: any) {
      logger.error('Failed to get venue dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get event analytics
   */
  static async getEventAnalytics(
    eventId: string,
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<EventAnalytics> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          organizer: true,
          ticketTypes: true,
          _count: {
            select: { tickets: true }
          }
        }
      });

      if (!event) {
        throw new CustomError('Event not found', 404);
      }

      const [
        totalViews,
        uniqueViews,
        ticketsSold,
        totalRevenue,
        refunds,
        refundAmount,
        qrScans,
        uniqueScans
      ] = await Promise.all([
        prisma.eventAnalytics.aggregate({
          where: { eventId },
          _sum: { views: true }
        }),
        prisma.eventAnalytics.aggregate({
          where: { eventId },
          _sum: { uniqueViews: true }
        }),
        prisma.ticket.count({
          where: {
            eventId,
            status: { in: [TicketStatus.SOLD, TicketStatus.USED] }
          }
        }),
        prisma.payment.aggregate({
          where: {
            status: PaymentStatus.COMPLETED,
            ticket: { eventId }
          },
          _sum: { amount: true }
        }),
        prisma.ticket.count({
          where: { eventId, status: TicketStatus.REFUNDED }
        }),
        prisma.payment.aggregate({
          where: {
            status: PaymentStatus.REFUNDED,
            ticket: { eventId }
          },
          _sum: { amount: true }
        }),
        prisma.qRScan.count({
          where: { ticket: { eventId } }
        }),
        prisma.qRScan.count({
          where: { ticket: { eventId }, isScanned: true }
        })
      ]);

      const conversionRate = totalViews._sum.views 
        ? (ticketsSold / totalViews._sum.views) * 100 
        : 0;

      const averageTicketPrice = ticketsSold > 0 
        ? (totalRevenue._sum.amount || 0) / ticketsSold 
        : 0;

      // Get sales by day
      const salesByDay = await this.getEventSalesByDay(eventId, startDate, endDate, granularity);

      // Get ticket type statistics
      const ticketTypeStats = event.ticketTypes.map(type => ({
        name: type.name,
        total: type.quantity,
        sold: type.sold,
        revenue: type.sold * type.price
      }));

      return {
        eventId,
        eventName: event.name,
        totalViews: totalViews._sum.views || 0,
        uniqueViews: uniqueViews._sum.uniqueViews || 0,
        ticketsSold,
        totalRevenue: totalRevenue._sum.amount || 0,
        conversionRate,
        averageTicketPrice,
        salesByDay,
        ticketTypeStats,
        refunds,
        refundAmount: refundAmount._sum.amount || 0,
        qrScans,
        uniqueScans
      };
    } catch (error: any) {
      logger.error('Failed to get event analytics:', error);
      throw error;
    }
  }

  /**
   * Get admin revenue analytics
   */
  static async getAdminRevenueAnalytics(
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<RevenueAnalytics> {
    try {
      const where: Prisma.PaymentWhereInput = {
        status: PaymentStatus.COMPLETED
      };

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate
        };
      }

      const [
        totalRevenue,
        revenueByEvent,
        revenueByPaymentMethod,
        refunds
      ] = await Promise.all([
        prisma.payment.aggregate({
          where,
          _sum: { amount: true }
        }),
        prisma.payment.groupBy({
          by: ['ticketId'],
          where,
          _sum: { amount: true },
          _count: { id: true }
        }),
        prisma.payment.groupBy({
          by: ['method'],
          where,
          _sum: { amount: true },
          _count: { id: true }
        }),
        prisma.payment.aggregate({
          where: { status: PaymentStatus.REFUNDED },
          _sum: { amount: true },
          _count: { id: true }
        })
      ]);

      // Get revenue by month
      const revenueByMonth = await this.getRevenueByMonth(startDate, endDate, granularity);

      // Get refunds by month
      const refundsByMonth = await this.getRefundsByMonth(startDate, endDate, granularity);

      // Get event details for revenue by event
      const eventDetails = await Promise.all(
        revenueByEvent.map(async (item) => {
          const ticket = await prisma.ticket.findUnique({
            where: { id: item.ticketId },
            include: { event: true }
          });
          return {
            eventId: ticket?.eventId || '',
            eventName: ticket?.event.name || 'Unknown',
            revenue: item._sum.amount || 0,
            ticketsSold: item._count.id
          };
        })
      );

      return {
        totalRevenue: totalRevenue._sum.amount || 0,
        revenueByMonth,
        revenueByEvent: eventDetails,
        revenueByPaymentMethod: revenueByPaymentMethod.map(item => ({
          method: item.method,
          revenue: item._sum.amount || 0,
          count: item._count.id
        })),
        refunds: {
          total: refunds._count.id,
          amount: refunds._sum.amount || 0,
          byMonth: refundsByMonth
        }
      };
    } catch (error: any) {
      logger.error('Failed to get admin revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get organizer revenue analytics
   */
  static async getOrganizerRevenueAnalytics(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day',
    eventId?: string
  ): Promise<RevenueAnalytics> {
    try {
      const organizer = await prisma.organizer.findUnique({
        where: { userId }
      });

      if (!organizer) {
        throw new CustomError('Organizer not found', 404);
      }

      const where: Prisma.PaymentWhereInput = {
        status: PaymentStatus.COMPLETED,
        ticket: {
          event: { organizerId: organizer.id }
        }
      };

      if (eventId) {
        where.ticket = { eventId };
      }

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate
        };
      }

      const [
        totalRevenue,
        revenueByEvent,
        revenueByPaymentMethod,
        refunds
      ] = await Promise.all([
        prisma.payment.aggregate({
          where,
          _sum: { amount: true }
        }),
        prisma.payment.groupBy({
          by: ['ticketId'],
          where,
          _sum: { amount: true },
          _count: { id: true }
        }),
        prisma.payment.groupBy({
          by: ['method'],
          where,
          _sum: { amount: true },
          _count: { id: true }
        }),
        prisma.payment.aggregate({
          where: {
            status: PaymentStatus.REFUNDED,
            ticket: {
              event: { organizerId: organizer.id }
            }
          },
          _sum: { amount: true },
          _count: { id: true }
        })
      ]);

      // Get revenue by month for organizer
      const revenueByMonth = await this.getOrganizerRevenueByMonth(organizer.id, startDate, endDate, granularity);

      // Get refunds by month for organizer
      const refundsByMonth = await this.getOrganizerRefundsByMonth(organizer.id, startDate, endDate, granularity);

      // Get event details for revenue by event
      const eventDetails = await Promise.all(
        revenueByEvent.map(async (item) => {
          const ticket = await prisma.ticket.findUnique({
            where: { id: item.ticketId },
            include: { event: true }
          });
          return {
            eventId: ticket?.eventId || '',
            eventName: ticket?.event.name || 'Unknown',
            revenue: item._sum.amount || 0,
            ticketsSold: item._count.id
          };
        })
      );

      return {
        totalRevenue: totalRevenue._sum.amount || 0,
        revenueByMonth,
        revenueByEvent: eventDetails,
        revenueByPaymentMethod: revenueByPaymentMethod.map(item => ({
          method: item.method,
          revenue: item._sum.amount || 0,
          count: item._count.id
        })),
        refunds: {
          total: refunds._count.id,
          amount: refunds._sum.amount || 0,
          byMonth: refundsByMonth
        }
      };
    } catch (error: any) {
      logger.error('Failed to get organizer revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<UserAnalytics> {
    try {
      const where: Prisma.UserWhereInput = {};
      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate
        };
      }

      const [
        totalUsers,
        usersByRole,
        usersByStatus,
        activeUsers,
        newUsersThisMonth
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.groupBy({
          by: ['role'],
          _count: { id: true }
        }),
        prisma.user.groupBy({
          by: ['status'],
          _count: { id: true }
        }),
        prisma.user.count({
          where: {
            lastLogin: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      ]);

      // Get user growth by month
      const userGrowthByMonth = await this.getUserGrowthByMonth(startDate, endDate, granularity);

      // Calculate user retention (simplified)
      const userRetention = await this.calculateUserRetention();

      return {
        totalUsers,
        usersByRole: usersByRole.map(item => ({
          role: item.role,
          count: item._count.id
        })),
        usersByStatus: usersByStatus.map(item => ({
          status: item.status,
          count: item._count.id
        })),
        userGrowthByMonth,
        activeUsers,
        newUsersThisMonth,
        userRetention
      };
    } catch (error: any) {
      logger.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  /**
   * Get admin ticket analytics
   */
  static async getAdminTicketAnalytics(
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<TicketAnalytics> {
    try {
      const where: Prisma.TicketWhereInput = {};
      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate
        };
      }

      const [
        totalTickets,
        soldTickets,
        usedTickets,
        refundedTickets,
        availableTickets,
        totalRevenue,
        ticketsByStatus,
        topEvents
      ] = await Promise.all([
        prisma.ticket.count({ where }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.SOLD } }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.USED } }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.REFUNDED } }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.AVAILABLE } }),
        prisma.payment.aggregate({
          where: {
            status: PaymentStatus.COMPLETED,
            ticket: where
          },
          _sum: { amount: true }
        }),
        prisma.ticket.groupBy({
          by: ['status'],
          where,
          _count: { id: true }
        }),
        prisma.ticket.groupBy({
          by: ['eventId'],
          where: { ...where, status: { in: [TicketStatus.SOLD, TicketStatus.USED] } },
          _sum: { price: true },
          _count: { id: true }
        })
      ]);

      const averageTicketPrice = soldTickets > 0 
        ? (totalRevenue._sum.amount || 0) / soldTickets 
        : 0;

      // Get sales by day
      const salesByDay = await this.getTicketSalesByDay(startDate, endDate, granularity);

      // Get event details for top events
      const topEventsDetails = await Promise.all(
        topEvents.slice(0, 10).map(async (item) => {
          const event = await prisma.event.findUnique({
            where: { id: item.eventId }
          });
          return {
            eventId: item.eventId,
            eventName: event?.name || 'Unknown',
            ticketsSold: item._count.id,
            revenue: item._sum.price || 0
          };
        })
      );

      return {
        totalTickets,
        soldTickets,
        usedTickets,
        refundedTickets,
        availableTickets,
        totalRevenue: totalRevenue._sum.amount || 0,
        averageTicketPrice,
        ticketsByStatus: ticketsByStatus.map(item => ({
          status: item.status,
          count: item._count.id
        })),
        salesByDay,
        topEvents: topEventsDetails
      };
    } catch (error: any) {
      logger.error('Failed to get admin ticket analytics:', error);
      throw error;
    }
  }

  /**
   * Get organizer ticket analytics
   */
  static async getOrganizerTicketAnalytics(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day',
    eventId?: string
  ): Promise<TicketAnalytics> {
    try {
      const organizer = await prisma.organizer.findUnique({
        where: { userId }
      });

      if (!organizer) {
        throw new CustomError('Organizer not found', 404);
      }

      const where: Prisma.TicketWhereInput = {
        event: { organizerId: organizer.id }
      };

      if (eventId) {
        where.eventId = eventId;
      }

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate
        };
      }

      const [
        totalTickets,
        soldTickets,
        usedTickets,
        refundedTickets,
        availableTickets,
        totalRevenue,
        ticketsByStatus,
        topEvents
      ] = await Promise.all([
        prisma.ticket.count({ where }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.SOLD } }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.USED } }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.REFUNDED } }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.AVAILABLE } }),
        prisma.payment.aggregate({
          where: {
            status: PaymentStatus.COMPLETED,
            ticket: where
          },
          _sum: { amount: true }
        }),
        prisma.ticket.groupBy({
          by: ['status'],
          where,
          _count: { id: true }
        }),
        prisma.ticket.groupBy({
          by: ['eventId'],
          where: { ...where, status: { in: [TicketStatus.SOLD, TicketStatus.USED] } },
          _sum: { price: true },
          _count: { id: true }
        })
      ]);

      const averageTicketPrice = soldTickets > 0 
        ? (totalRevenue._sum.amount || 0) / soldTickets 
        : 0;

      // Get sales by day for organizer
      const salesByDay = await this.getOrganizerTicketSalesByDay(organizer.id, startDate, endDate, granularity);

      // Get event details for top events
      const topEventsDetails = await Promise.all(
        topEvents.slice(0, 10).map(async (item) => {
          const event = await prisma.event.findUnique({
            where: { id: item.eventId }
          });
          return {
            eventId: item.eventId,
            eventName: event?.name || 'Unknown',
            ticketsSold: item._count.id,
            revenue: item._sum.price || 0
          };
        })
      );

      return {
        totalTickets,
        soldTickets,
        usedTickets,
        refundedTickets,
        availableTickets,
        totalRevenue: totalRevenue._sum.amount || 0,
        averageTicketPrice,
        ticketsByStatus: ticketsByStatus.map(item => ({
          status: item.status,
          count: item._count.id
        })),
        salesByDay,
        topEvents: topEventsDetails
      };
    } catch (error: any) {
      logger.error('Failed to get organizer ticket analytics:', error);
      throw error;
    }
  }

  /**
   * Export data
   */
  static async exportData(
    type: string,
    format: 'csv' | 'xlsx' | 'json',
    options: ExportOptions
  ): Promise<string> {
    try {
      // This is a simplified implementation
      // In a real application, you would use libraries like csv-writer, xlsx, etc.
      
      let data: any[] = [];
      
      switch (type) {
        case 'users':
          data = await prisma.user.findMany({
            where: options.userId ? { id: options.userId } : {},
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              status: true,
              createdAt: true
            }
          });
          break;
          
        case 'events':
          data = await prisma.event.findMany({
            where: options.eventId ? { id: options.eventId } : {},
            include: {
              organizer: { select: { name: true } },
              venue: { select: { name: true } }
            }
          });
          break;
          
        case 'tickets':
          data = await prisma.ticket.findMany({
            where: {
              ...(options.eventId ? { eventId: options.eventId } : {}),
              ...(options.userId ? { buyerId: options.userId } : {})
            },
            include: {
              event: { select: { name: true } },
              buyer: { select: { email: true } }
            }
          });
          break;
          
        case 'payments':
          data = await prisma.payment.findMany({
            where: {
              ...(options.userId ? { buyerId: options.userId } : {})
            },
            include: {
              ticket: {
                include: {
                  event: { select: { name: true } }
                }
              }
            }
          });
          break;
          
        default:
          throw new CustomError('Invalid export type', 400);
      }

      // Convert to requested format
      switch (format) {
        case 'json':
          return JSON.stringify(data, null, 2);
          
        case 'csv':
          // Simple CSV conversion
          if (data.length === 0) return '';
          const headers = Object.keys(data[0]).join(',');
          const rows = data.map(item => 
            Object.values(item).map(val => 
              typeof val === 'object' ? JSON.stringify(val) : val
            ).join(',')
          );
          return [headers, ...rows].join('\n');
          
        case 'xlsx':
          // For xlsx, you would use a library like xlsx
          // For now, return JSON
          return JSON.stringify(data, null, 2);
          
        default:
          throw new CustomError('Invalid export format', 400);
      }
    } catch (error: any) {
      logger.error('Failed to export data:', error);
      throw error;
    }
  }

  /**
   * Get real-time analytics
   */
  static async getRealTimeAnalytics(eventId?: string): Promise<any> {
    try {
      const where: Prisma.TicketWhereInput = {};
      if (eventId) {
        where.eventId = eventId;
      }

      const [
        liveTicketsSold,
        liveRevenue,
        recentPurchases,
        activeUsers
      ] = await Promise.all([
        prisma.ticket.count({
          where: {
            ...where,
            status: { in: [TicketStatus.SOLD, TicketStatus.USED] },
            purchaseDate: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        }),
        prisma.payment.aggregate({
          where: {
            status: PaymentStatus.COMPLETED,
            ticket: where,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          _sum: { amount: true }
        }),
        prisma.ticket.findMany({
          where: {
            ...where,
            status: { in: [TicketStatus.SOLD, TicketStatus.USED] },
            purchaseDate: {
              gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
            }
          },
          take: 10,
          orderBy: { purchaseDate: 'desc' },
          include: {
            event: { select: { name: true } },
            buyer: { select: { email: true } }
          }
        }),
        prisma.user.count({
          where: {
            lastLogin: {
              gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
            }
          }
        })
      ]);

      return {
        liveTicketsSold,
        liveRevenue: liveRevenue._sum.amount || 0,
        recentPurchases,
        activeUsers,
        timestamp: new Date()
      };
    } catch (error: any) {
      logger.error('Failed to get real-time analytics:', error);
      throw error;
    }
  }

  /**
   * Get organizer real-time analytics
   */
  static async getOrganizerRealTimeAnalytics(userId: string, eventId?: string): Promise<any> {
    try {
      const organizer = await prisma.organizer.findUnique({
        where: { userId }
      });

      if (!organizer) {
        throw new CustomError('Organizer not found', 404);
      }

      const where: Prisma.TicketWhereInput = {
        event: { organizerId: organizer.id }
      };

      if (eventId) {
        where.eventId = eventId;
      }

      const [
        liveTicketsSold,
        liveRevenue,
        recentPurchases
      ] = await Promise.all([
        prisma.ticket.count({
          where: {
            ...where,
            status: { in: [TicketStatus.SOLD, TicketStatus.USED] },
            purchaseDate: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        }),
        prisma.payment.aggregate({
          where: {
            status: PaymentStatus.COMPLETED,
            ticket: where,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          _sum: { amount: true }
        }),
        prisma.ticket.findMany({
          where: {
            ...where,
            status: { in: [TicketStatus.SOLD, TicketStatus.USED] },
            purchaseDate: {
              gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
            }
          },
          take: 10,
          orderBy: { purchaseDate: 'desc' },
          include: {
            event: { select: { name: true } },
            buyer: { select: { email: true } }
          }
        })
      ]);

      return {
        liveTicketsSold,
        liveRevenue: liveRevenue._sum.amount || 0,
        recentPurchases,
        timestamp: new Date()
      };
    } catch (error: any) {
      logger.error('Failed to get organizer real-time analytics:', error);
      throw error;
    }
  }

  // Helper methods
  private static async getRevenueByMonth(
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ month: string; revenue: number }>> {
    // Implementation for getting revenue by month
    // This is a simplified version - in reality you'd use proper date grouping
    return [];
  }

  private static async getUserGrowthByMonth(
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ month: string; users: number }>> {
    // Implementation for getting user growth by month
    return [];
  }

  private static async getOrganizerRevenueByMonth(
    organizerId: string,
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ month: string; revenue: number }>> {
    // Implementation for getting organizer revenue by month
    return [];
  }

  private static async getVenueRevenueByMonth(
    venueOwnerId: string,
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ month: string; revenue: number }>> {
    // Implementation for getting venue revenue by month
    return [];
  }

  private static async getRefundsByMonth(
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ month: string; amount: number }>> {
    // Implementation for getting refunds by month
    return [];
  }

  private static async getOrganizerRefundsByMonth(
    organizerId: string,
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ month: string; amount: number }>> {
    // Implementation for getting organizer refunds by month
    return [];
  }

  private static async getEventSalesByDay(
    eventId: string,
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ date: string; ticketsSold: number; revenue: number }>> {
    // Implementation for getting event sales by day
    return [];
  }

  private static async getTicketSalesByDay(
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ date: string; ticketsSold: number; revenue: number }>> {
    // Implementation for getting ticket sales by day
    return [];
  }

  private static async getOrganizerTicketSalesByDay(
    organizerId: string,
    startDate?: Date,
    endDate?: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ date: string; ticketsSold: number; revenue: number }>> {
    // Implementation for getting organizer ticket sales by day
    return [];
  }

  private static async calculateUserRetention(): Promise<{ day1: number; day7: number; day30: number }> {
    // Implementation for calculating user retention
    return { day1: 0, day7: 0, day30: 0 };
  }
}
