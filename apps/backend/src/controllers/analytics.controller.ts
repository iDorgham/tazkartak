import { Request, Response } from 'express';
import { realtimeService } from '../services/realtime.service';
import { logger } from '../utils/logger.util';
import { CustomError } from '../middleware/errorHandler.middleware';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export class AnalyticsController {
  /**
   * Get widget analytics for an organizer
   */
  static async getWidgetAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { eventId, startDate, endDate } = req.query;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const analytics = await realtimeService.getWidgetAnalytics(
        userId,
        eventId as string,
        start,
        end
      );

      res.status(200).json({
        success: true,
        data: analytics,
        count: analytics.length,
      });
    } catch (error: any) {
      logger.error('Get widget analytics error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get widget analytics',
      });
    }
  }

  /**
   * Get analytics summary for an organizer
   */
  static async getAnalyticsSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { eventId } = req.query;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      const summary = await realtimeService.getAnalyticsSummary(
        userId,
        eventId as string
      );

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      logger.error('Get analytics summary error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get analytics summary',
      });
    }
  }

  /**
   * Get real-time analytics dashboard data
   */
  static async getRealtimeDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      // Get analytics summary
      const summary = await realtimeService.getAnalyticsSummary(userId);

      // Get recent analytics (last 24 hours)
      const recentAnalytics = await realtimeService.getWidgetAnalytics(
        userId,
        undefined,
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date()
      );

      // Get connected clients count
      const connectedClients = realtimeService.getConnectedClientsCount();

      // Calculate hourly breakdown for the last 24 hours
      const hourlyBreakdown = this.calculateHourlyBreakdown(recentAnalytics);

      res.status(200).json({
        success: true,
        data: {
          summary,
          recentAnalytics: recentAnalytics.slice(0, 50), // Last 50 events
          hourlyBreakdown,
          connectedClients,
          lastUpdated: new Date(),
        },
      });
    } catch (error: any) {
      logger.error('Get realtime dashboard error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get realtime dashboard data',
      });
    }
  }

  /**
   * Track custom analytics event
   */
  static async trackCustomEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { action, eventId, metadata } = req.body;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      if (!action) {
        throw new CustomError('Action is required', 400);
      }

      const analyticsData = {
        widgetId: `custom-${Date.now()}`,
        organizerId: userId,
        eventId,
        action,
        metadata,
        timestamp: new Date(),
      };

      // Track the analytics
      await realtimeService['trackWidgetAnalytics'](analyticsData);

      res.status(200).json({
        success: true,
        message: 'Analytics event tracked successfully',
      });
    } catch (error: any) {
      logger.error('Track custom event error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to track custom event',
      });
    }
  }

  /**
   * Get analytics for a specific event
   */
  static async getEventAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { eventId } = req.params;
      const { startDate, endDate } = req.query;

      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      if (!eventId) {
        throw new CustomError('Event ID is required', 400);
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const analytics = await realtimeService.getWidgetAnalytics(
        userId,
        eventId,
        start,
        end
      );

      const summary = await realtimeService.getAnalyticsSummary(userId, eventId);

      // Calculate conversion funnel
      const funnel = this.calculateConversionFunnel(analytics);

      res.status(200).json({
        success: true,
        data: {
          analytics,
          summary,
          funnel,
          count: analytics.length,
        },
      });
    } catch (error: any) {
      logger.error('Get event analytics error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get event analytics',
      });
    }
  }

  /**
   * Calculate hourly breakdown of analytics
   */
  private static calculateHourlyBreakdown(analytics: any[]): any[] {
    const hourlyData: { [key: string]: any } = {};
    
    // Initialize last 24 hours
    for (let i = 0; i < 24; i++) {
      const hour = new Date(Date.now() - i * 60 * 60 * 1000);
      const hourKey = hour.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      hourlyData[hourKey] = {
        hour: hourKey,
        loads: 0,
        views: 0,
        purchases: 0,
        revenue: 0,
      };
    }

    // Count analytics by hour
    for (const data of analytics) {
      const hour = new Date(data.timestamp).toISOString().slice(0, 13);
      if (hourlyData[hour]) {
        switch (data.action) {
          case 'load':
            hourlyData[hour].loads++;
            break;
          case 'view':
            hourlyData[hour].views++;
            break;
          case 'purchase':
            hourlyData[hour].purchases++;
            if (data.metadata?.amount) {
              hourlyData[hour].revenue += data.metadata.amount;
            }
            break;
        }
      }
    }

    return Object.values(hourlyData).reverse(); // Most recent first
  }

  /**
   * Calculate conversion funnel
   */
  private static calculateConversionFunnel(analytics: any[]): {
    loads: number;
    views: number;
    ticketSelections: number;
    checkouts: number;
    purchases: number;
    conversionRates: {
      loadToView: number;
      viewToSelection: number;
      selectionToCheckout: number;
      checkoutToPurchase: number;
      overall: number;
    };
  } {
    const funnel = {
      loads: 0,
      views: 0,
      ticketSelections: 0,
      checkouts: 0,
      purchases: 0,
    };

    for (const data of analytics) {
      switch (data.action) {
        case 'load':
          funnel.loads++;
          break;
        case 'view':
          funnel.views++;
          break;
        case 'ticket_select':
          funnel.ticketSelections++;
          break;
        case 'checkout_start':
          funnel.checkouts++;
          break;
        case 'purchase':
          funnel.purchases++;
          break;
      }
    }

    const conversionRates = {
      loadToView: funnel.loads > 0 ? (funnel.views / funnel.loads) * 100 : 0,
      viewToSelection: funnel.views > 0 ? (funnel.ticketSelections / funnel.views) * 100 : 0,
      selectionToCheckout: funnel.ticketSelections > 0 ? (funnel.checkouts / funnel.ticketSelections) * 100 : 0,
      checkoutToPurchase: funnel.checkouts > 0 ? (funnel.purchases / funnel.checkouts) * 100 : 0,
      overall: funnel.loads > 0 ? (funnel.purchases / funnel.loads) * 100 : 0,
    };

    return {
      ...funnel,
      conversionRates,
    };
  }
}

export const analyticsController = new AnalyticsController();