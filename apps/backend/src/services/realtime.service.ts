import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger.util';
import { redis } from '../config/redis.config';
import { io } from '../server';

export interface RealtimeEvent {
  type: string;
  eventId?: string;
  organizerId?: string;
  data: any;
  timestamp: Date;
}

export interface WidgetAnalytics {
  widgetId: string;
  organizerId: string;
  eventId?: string;
  action: 'load' | 'view' | 'ticket_select' | 'checkout_start' | 'checkout_complete' | 'purchase' | 'error';
  metadata?: {
    ticketType?: string;
    quantity?: number;
    amount?: number;
    error?: string;
    userAgent?: string;
    referrer?: string;
    ip?: string;
  };
  timestamp: Date;
}

export class RealtimeService {
  private static instance: RealtimeService;
  private io: SocketIOServer;

  private constructor() {
    this.io = io;
    this.setupNamespaces();
    this.setupEventHandlers();
  }

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Setup WebSocket namespaces
   */
  private setupNamespaces(): void {
    // Widget namespace for real-time widget updates
    const widgetNamespace = this.io.of('/widget');
    
    widgetNamespace.on('connection', (socket) => {
      logger.info(`Widget client connected: ${socket.id}`);

      // Subscribe to event-specific updates
      socket.on('subscribe:event', (eventId: string) => {
        if (eventId) {
          socket.join(`event:${eventId}`);
          logger.info(`Widget client ${socket.id} subscribed to event ${eventId}`);
        }
      });

      // Subscribe to organizer updates
      socket.on('subscribe:organizer', (organizerId: string) => {
        if (organizerId) {
          socket.join(`organizer:${organizerId}`);
          logger.info(`Widget client ${socket.id} subscribed to organizer ${organizerId}`);
        }
      });

      // Handle analytics tracking
      socket.on('track:analytics', (analyticsData: WidgetAnalytics) => {
        this.trackWidgetAnalytics(analyticsData);
      });

      socket.on('disconnect', () => {
        logger.info(`Widget client disconnected: ${socket.id}`);
      });
    });

    // Organizer namespace for dashboard updates
    const organizerNamespace = this.io.of('/organizer');
    
    organizerNamespace.on('connection', (socket) => {
      logger.info(`Organizer client connected: ${socket.id}`);

      socket.on('subscribe:organizer', (organizerId: string) => {
        if (organizerId) {
          socket.join(`organizer:${organizerId}`);
          logger.info(`Organizer client ${socket.id} subscribed to organizer ${organizerId}`);
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Organizer client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Setup event handlers for real-time events
   */
  private setupEventHandlers(): void {
    // Listen for Redis pub/sub events
    redis.subscribe('realtime:events');
    redis.subscribe('realtime:widget');

    redis.on('message', (channel: string, message: string) => {
      try {
        const event: RealtimeEvent = JSON.parse(message);
        
        switch (channel) {
          case 'realtime:events':
            this.broadcastEventUpdate(event);
            break;
          case 'realtime:widget':
            this.broadcastWidgetUpdate(event);
            break;
        }
      } catch (error) {
        logger.error('Error parsing realtime message:', error);
      }
    });
  }

  /**
   * Broadcast event updates to subscribed clients
   */
  private broadcastEventUpdate(event: RealtimeEvent): void {
    const widgetNamespace = this.io.of('/widget');
    const organizerNamespace = this.io.of('/organizer');

    if (event.eventId) {
      // Broadcast to event subscribers
      widgetNamespace.to(`event:${event.eventId}`).emit('event:update', event);
      organizerNamespace.to(`event:${event.eventId}`).emit('event:update', event);
    }

    if (event.organizerId) {
      // Broadcast to organizer subscribers
      organizerNamespace.to(`organizer:${event.organizerId}`).emit('event:update', event);
    }
  }

  /**
   * Broadcast widget updates to subscribed clients
   */
  private broadcastWidgetUpdate(event: RealtimeEvent): void {
    const widgetNamespace = this.io.of('/widget');
    const organizerNamespace = this.io.of('/organizer');

    if (event.eventId) {
      widgetNamespace.to(`event:${event.eventId}`).emit('widget:update', event);
    }

    if (event.organizerId) {
      organizerNamespace.to(`organizer:${event.organizerId}`).emit('widget:update', event);
    }
  }

  /**
   * Emit real-time event
   */
  public emitRealtimeEvent(event: RealtimeEvent): void {
    try {
      // Publish to Redis for distributed broadcasting
      redis.publish('realtime:events', JSON.stringify(event));
      
      // Also publish to widget channel if it's widget-related
      if (event.type.startsWith('widget:')) {
        redis.publish('realtime:widget', JSON.stringify(event));
      }

      logger.info(`Realtime event emitted: ${event.type}`, event);
    } catch (error) {
      logger.error('Error emitting realtime event:', error);
    }
  }

  /**
   * Track widget analytics
   */
  private async trackWidgetAnalytics(analyticsData: WidgetAnalytics): Promise<void> {
    try {
      // Store analytics in Redis for real-time processing
      const key = `analytics:widget:${analyticsData.organizerId}:${new Date().toISOString().split('T')[0]}`;
      await redis.lpush(key, JSON.stringify(analyticsData));
      await redis.expire(key, 30 * 24 * 60 * 60); // Keep for 30 days

      // Store in database for long-term analytics
      await this.storeAnalyticsInDatabase(analyticsData);

      // Emit real-time analytics event to organizer
      this.emitRealtimeEvent({
        type: 'analytics:widget',
        organizerId: analyticsData.organizerId,
        eventId: analyticsData.eventId,
        data: analyticsData,
        timestamp: new Date(),
      });

      logger.info(`Widget analytics tracked: ${analyticsData.action}`, analyticsData);
    } catch (error) {
      logger.error('Error tracking widget analytics:', error);
    }
  }

  /**
   * Store analytics in database
   */
  private async storeAnalyticsInDatabase(analytics: WidgetAnalytics): Promise<void> {
    try {
      // This would typically use Prisma to store in database
      // For now, we'll use Redis as the primary storage
      const dbKey = `analytics:db:${analytics.widgetId}:${analytics.timestamp.getTime()}`;
      await redis.setex(dbKey, 365 * 24 * 60 * 60, JSON.stringify(analytics)); // Keep for 1 year
    } catch (error) {
      logger.error('Error storing analytics in database:', error);
    }
  }

  /**
   * Get widget analytics for an organizer
   */
  public async getWidgetAnalytics(
    organizerId: string,
    eventId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<WidgetAnalytics[]> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate || new Date();

      const analytics: WidgetAnalytics[] = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const key = `analytics:widget:${organizerId}:${dateKey}`;
        
        const dayAnalytics = await redis.lrange(key, 0, -1);
        
        for (const analyticsStr of dayAnalytics) {
          const analyticsData: WidgetAnalytics = JSON.parse(analyticsStr);
          
          // Filter by eventId if specified
          if (!eventId || analyticsData.eventId === eventId) {
            analytics.push(analyticsData);
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return analytics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      logger.error('Error getting widget analytics:', error);
      return [];
    }
  }

  /**
   * Get analytics summary for an organizer
   */
  public async getAnalyticsSummary(organizerId: string, eventId?: string): Promise<{
    totalLoads: number;
    totalViews: number;
    totalTicketSelections: number;
    totalCheckouts: number;
    totalPurchases: number;
    totalErrors: number;
    conversionRate: number;
    revenue: number;
  }> {
    try {
      const analytics = await this.getWidgetAnalytics(organizerId, eventId);
      
      const summary = {
        totalLoads: 0,
        totalViews: 0,
        totalTicketSelections: 0,
        totalCheckouts: 0,
        totalPurchases: 0,
        totalErrors: 0,
        conversionRate: 0,
        revenue: 0,
      };

      for (const data of analytics) {
        switch (data.action) {
          case 'load':
            summary.totalLoads++;
            break;
          case 'view':
            summary.totalViews++;
            break;
          case 'ticket_select':
            summary.totalTicketSelections++;
            break;
          case 'checkout_start':
            summary.totalCheckouts++;
            break;
          case 'purchase':
            summary.totalPurchases++;
            if (data.metadata?.amount) {
              summary.revenue += data.metadata.amount;
            }
            break;
          case 'error':
            summary.totalErrors++;
            break;
        }
      }

      // Calculate conversion rate
      if (summary.totalLoads > 0) {
        summary.conversionRate = (summary.totalPurchases / summary.totalLoads) * 100;
      }

      return summary;
    } catch (error) {
      logger.error('Error getting analytics summary:', error);
      return {
        totalLoads: 0,
        totalViews: 0,
        totalTicketSelections: 0,
        totalCheckouts: 0,
        totalPurchases: 0,
        totalErrors: 0,
        conversionRate: 0,
        revenue: 0,
      };
    }
  }

  /**
   * Emit ticket availability update
   */
  public emitTicketAvailabilityUpdate(eventId: string, ticketTypeId: string, available: number): void {
    this.emitRealtimeEvent({
      type: 'ticket:availability',
      eventId,
      data: {
        ticketTypeId,
        available,
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });
  }

  /**
   * Emit event status update
   */
  public emitEventStatusUpdate(eventId: string, organizerId: string, status: string): void {
    this.emitRealtimeEvent({
      type: 'event:status',
      eventId,
      organizerId,
      data: {
        status,
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });
  }

  /**
   * Emit purchase notification
   */
  public emitPurchaseNotification(eventId: string, organizerId: string, purchaseData: any): void {
    this.emitRealtimeEvent({
      type: 'purchase:completed',
      eventId,
      organizerId,
      data: {
        ...purchaseData,
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });
  }

  /**
   * Get connected clients count
   */
  public getConnectedClientsCount(): { widget: number; organizer: number } {
    const widgetNamespace = this.io.of('/widget');
    const organizerNamespace = this.io.of('/organizer');

    return {
      widget: widgetNamespace.sockets.size,
      organizer: organizerNamespace.sockets.size,
    };
  }
}

export const realtimeService = RealtimeService.getInstance();
