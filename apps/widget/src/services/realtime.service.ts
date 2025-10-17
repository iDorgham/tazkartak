import { io, Socket } from 'socket.io-client';
import { logger } from '../utils/logger.util';

export interface WidgetAnalytics {
  widgetId: string;
  organizerId: string;
  eventId?: string;
  action: 'load' | 'view' | 'ticket_select' | 'checkout_start' | 'checkout_complete' | 'purchase' | 'error' | 'form_interaction' | 'scroll_engagement' | 'visibility_change' | 'purchase_attempt';
  metadata?: {
    ticketType?: string;
    quantity?: number;
    amount?: number;
    error?: string;
    userAgent?: string;
    referrer?: string;
    ip?: string;
    loadTime?: number;
    sessionId?: string;
    timestamp?: string;
    [key: string]: any; // Allow additional properties
  };
  timestamp: Date;
}

export interface RealtimeEvent {
  type: string;
  eventId?: string;
  organizerId?: string;
  data: any;
  timestamp: Date;
}

export class WidgetRealtimeService {
  private socket: Socket | null = null;
  private widgetId: string;
  private organizerId: string;
  private eventId?: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor(widgetId: string, organizerId: string, eventId?: string) {
    this.widgetId = widgetId;
    this.organizerId = organizerId;
    this.eventId = eventId;
  }

  /**
   * Initialize real-time connection
   */
  public initialize(serverUrl: string): void {
    try {
      this.socket = io(`${serverUrl}/widget`, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      this.setupEventHandlers();
      this.subscribeToEvents();
      
      logger.info('Widget realtime service initialized', {
        widgetId: this.widgetId,
        organizerId: this.organizerId,
        eventId: this.eventId,
      });
    } catch (error) {
      logger.error('Failed to initialize realtime service:', error);
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Widget connected to realtime service');
      
      // Track connection event
      this.trackAnalytics('load', {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      logger.warn('Widget disconnected from realtime service:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      logger.error('Widget connection error:', error);
      this.handleReconnect();
    });

    // Listen for real-time updates
    this.socket.on('event:update', (event: RealtimeEvent) => {
      this.handleEventUpdate(event);
    });

    this.socket.on('widget:update', (event: RealtimeEvent) => {
      this.handleWidgetUpdate(event);
    });

    // Listen for ticket availability updates
    this.socket.on('ticket:availability', (data: any) => {
      this.handleTicketAvailabilityUpdate(data);
    });

    // Listen for event status updates
    this.socket.on('event:status', (data: any) => {
      this.handleEventStatusUpdate(data);
    });
  }

  /**
   * Subscribe to relevant events
   */
  private subscribeToEvents(): void {
    if (!this.socket) return;

    if (this.eventId) {
      this.socket.emit('subscribe:event', this.eventId);
    }

    this.socket.emit('subscribe:organizer', this.organizerId);
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Handle event updates
   */
  private handleEventUpdate(event: RealtimeEvent): void {
    logger.info('Received event update:', event);
    
    // Emit custom event for widget to handle
    window.dispatchEvent(new CustomEvent('tazkartak:eventUpdate', {
      detail: event,
    }));
  }

  /**
   * Handle widget updates
   */
  private handleWidgetUpdate(event: RealtimeEvent): void {
    logger.info('Received widget update:', event);
    
    // Emit custom event for widget to handle
    window.dispatchEvent(new CustomEvent('tazkartak:widgetUpdate', {
      detail: event,
    }));
  }

  /**
   * Handle ticket availability updates
   */
  private handleTicketAvailabilityUpdate(data: any): void {
    logger.info('Received ticket availability update:', data);
    
    // Emit custom event for widget to handle
    window.dispatchEvent(new CustomEvent('tazkartak:ticketAvailability', {
      detail: data,
    }));
  }

  /**
   * Handle event status updates
   */
  private handleEventStatusUpdate(data: any): void {
    logger.info('Received event status update:', data);
    
    // Emit custom event for widget to handle
    window.dispatchEvent(new CustomEvent('tazkartak:eventStatus', {
      detail: data,
    }));
  }

  /**
   * Track widget analytics
   */
  public trackAnalytics(
    action: WidgetAnalytics['action'],
    metadata?: WidgetAnalytics['metadata']
  ): void {
    const analyticsData: WidgetAnalytics = {
      widgetId: this.widgetId,
      organizerId: this.organizerId,
      eventId: this.eventId,
      action,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    };

    // Send to server via socket
    if (this.socket && this.isConnected) {
      this.socket.emit('track:analytics', analyticsData);
    }

    // Also send via HTTP as fallback
    this.sendAnalyticsViaHTTP(analyticsData);

    logger.info('Analytics tracked:', analyticsData);
  }

  /**
   * Send analytics via HTTP as fallback
   */
  private async sendAnalyticsViaHTTP(analytics: WidgetAnalytics): Promise<void> {
    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analytics),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      logger.error('Failed to send analytics via HTTP:', error);
    }
  }

  /**
   * Track widget load
   */
  public trackLoad(): void {
    this.trackAnalytics('load');
  }

  /**
   * Track widget view
   */
  public trackView(): void {
    this.trackAnalytics('view');
  }

  /**
   * Track ticket selection
   */
  public trackTicketSelection(ticketType: string, quantity: number): void {
    this.trackAnalytics('ticket_select', {
      ticketType,
      quantity,
    });
  }

  /**
   * Track checkout start
   */
  public trackCheckoutStart(ticketType: string, quantity: number, amount: number): void {
    this.trackAnalytics('checkout_start', {
      ticketType,
      quantity,
      amount,
    });
  }

  /**
   * Track checkout completion
   */
  public trackCheckoutComplete(ticketType: string, quantity: number, amount: number): void {
    this.trackAnalytics('checkout_complete', {
      ticketType,
      quantity,
      amount,
    });
  }

  /**
   * Track purchase
   */
  public trackPurchase(ticketType: string, quantity: number, amount: number): void {
    this.trackAnalytics('purchase', {
      ticketType,
      quantity,
      amount,
    });
  }

  /**
   * Track error
   */
  public trackError(error: string, context?: any): void {
    this.trackAnalytics('error', {
      error,
      ...context,
    });
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from real-time service
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      logger.info('Widget disconnected from realtime service');
    }
  }

  /**
   * Reconnect to real-time service
   */
  public reconnect(): void {
    if (this.socket && !this.isConnected) {
      this.socket.connect();
    }
  }
}

// Global instance
let realtimeServiceInstance: WidgetRealtimeService | null = null;

/**
 * Initialize global real-time service
 */
export function initializeRealtimeService(
  widgetId: string,
  organizerId: string,
  eventId: string,
  serverUrl: string = window.location.origin
): WidgetRealtimeService {
  if (!realtimeServiceInstance) {
    realtimeServiceInstance = new WidgetRealtimeService(widgetId, organizerId, eventId);
    realtimeServiceInstance.initialize(serverUrl);
  }
  return realtimeServiceInstance;
}

/**
 * Get global real-time service instance
 */
export function getRealtimeService(): WidgetRealtimeService | null {
  return realtimeServiceInstance;
}

/**
 * Track analytics using global service
 */
export function trackAnalytics(
  action: WidgetAnalytics['action'],
  metadata?: WidgetAnalytics['metadata']
): void {
  if (realtimeServiceInstance) {
    realtimeServiceInstance.trackAnalytics(action, metadata);
  }
}
