import { trackAnalytics } from './realtime.service';
import { logger } from '../utils/logger.util';

export interface AnalyticsEvent {
  action: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime?: number;
}

export class AnalyticsService {
  private widgetId: string;
  private organizerId: string;
  private eventId?: string;
  private sessionId: string;
  private startTime: number;
  private performanceMetrics: PerformanceMetrics;

  constructor(widgetId: string, organizerId: string, eventId?: string) {
    this.widgetId = widgetId;
    this.organizerId = organizerId;
    this.eventId = eventId;
    this.sessionId = this.generateSessionId();
    this.startTime = performance.now();
    this.performanceMetrics = {
      loadTime: 0,
      renderTime: 0,
    };

    this.initializeAnalytics();
  }

  /**
   * Initialize analytics tracking
   */
  private initializeAnalytics(): void {
    // Track widget load
    this.trackLoad();

    // Track performance metrics
    this.trackPerformanceMetrics();

    // Track user interactions
    this.setupInteractionTracking();

    // Track errors
    this.setupErrorTracking();

    // Track visibility changes
    this.setupVisibilityTracking();

    logger.info('Analytics service initialized', {
      widgetId: this.widgetId,
      organizerId: this.organizerId,
      eventId: this.eventId,
      sessionId: this.sessionId,
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track performance metrics
   */
  private trackPerformanceMetrics(): void {
    // Track load time
    window.addEventListener('load', () => {
      this.performanceMetrics.loadTime = performance.now() - this.startTime;
      
      trackAnalytics('load', {
        loadTime: this.performanceMetrics.loadTime,
        sessionId: this.sessionId,
      });
    });

    // Track render time
    requestAnimationFrame(() => {
      this.performanceMetrics.renderTime = performance.now() - this.startTime;
    });
  }

  /**
   * Setup interaction tracking
   */
  private setupInteractionTracking(): void {
    // Track clicks on ticket types
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      if (target.closest('[data-ticket-type]')) {
        const ticketType = target.closest('[data-ticket-type]')?.getAttribute('data-ticket-type');
        if (ticketType) {
          this.trackTicketTypeClick(ticketType);
        }
      }

      if (target.closest('[data-action="select-ticket"]')) {
        const ticketType = target.closest('[data-action="select-ticket"]')?.getAttribute('data-ticket-type');
        const quantity = target.closest('[data-action="select-ticket"]')?.getAttribute('data-quantity');
        if (ticketType && quantity) {
          this.trackTicketSelection(ticketType, parseInt(quantity));
        }
      }

      if (target.closest('[data-action="checkout"]')) {
        this.trackCheckoutStart();
      }

      if (target.closest('[data-action="purchase"]')) {
        this.trackPurchaseAttempt();
      }
    });

    // Track form interactions
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('form')) {
        this.trackFormInteraction();
      }
    });

    // Track scroll events (for engagement)
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackScrollEngagement();
      }, 1000);
    });
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('unhandled_promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
      });
    });

    // Track fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          this.trackError('fetch_error', {
            url: args[0],
            status: response.status,
            statusText: response.statusText,
          });
        }
        return response;
      } catch (error) {
        this.trackError('fetch_error', {
          url: args[0],
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };
  }

  /**
   * Setup visibility tracking
   */
  private setupVisibilityTracking(): void {
    let isVisible = !document.hidden;
    let visibilityStartTime = Date.now();

    document.addEventListener('visibilitychange', () => {
      const now = Date.now();
      
      if (document.hidden && isVisible) {
        // Widget became hidden
        const visibleTime = now - visibilityStartTime;
        this.trackVisibilityChange('hidden', visibleTime);
        isVisible = false;
      } else if (!document.hidden && !isVisible) {
        // Widget became visible
        visibilityStartTime = now;
        this.trackVisibilityChange('visible', 0);
        isVisible = true;
      }
    });
  }

  /**
   * Track widget load
   */
  private trackLoad(): void {
    trackAnalytics('load', {
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track widget view
   */
  public trackView(): void {
    trackAnalytics('view', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track ticket type click
   */
  private trackTicketTypeClick(ticketType: string): void {
    trackAnalytics('ticket_select', {
      ticketType,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track ticket selection
   */
  public trackTicketSelection(ticketType: string, quantity: number): void {
    trackAnalytics('ticket_select', {
      ticketType,
      quantity,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track checkout start
   */
  public trackCheckoutStart(ticketType?: string, quantity?: number, amount?: number): void {
    trackAnalytics('checkout_start', {
      ticketType,
      quantity,
      amount,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track checkout completion
   */
  public trackCheckoutComplete(ticketType?: string, quantity?: number, amount?: number): void {
    trackAnalytics('checkout_complete', {
      ticketType,
      quantity,
      amount,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track purchase
   */
  public trackPurchase(ticketType: string, quantity: number, amount: number): void {
    trackAnalytics('purchase', {
      ticketType,
      quantity,
      amount,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track error
   */
  public trackError(error: string, context?: Record<string, any>): void {
    trackAnalytics('error', {
      error,
      sessionId: this.sessionId,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track form interaction
   */
  private trackFormInteraction(): void {
    // Debounce form interactions
    clearTimeout((this as any).formInteractionTimeout);
    (this as any).formInteractionTimeout = setTimeout(() => {
      trackAnalytics('form_interaction', {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      });
    }, 1000);
  }

  /**
   * Track scroll engagement
   */
  private trackScrollEngagement(): void {
    trackAnalytics('scroll_engagement', {
      sessionId: this.sessionId,
      scrollY: window.scrollY,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track visibility change
   */
  private trackVisibilityChange(state: 'visible' | 'hidden', duration: number): void {
    trackAnalytics('visibility_change', {
      state,
      duration,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track purchase attempt
   */
  private trackPurchaseAttempt(): void {
    trackAnalytics('purchase_attempt', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Track custom event
   */
  public trackCustomEvent(action: string, metadata?: Record<string, any>): void {
    trackAnalytics(action as any, {
      ...metadata,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    });
  }
}

// Global instance
let analyticsServiceInstance: AnalyticsService | null = null;

/**
 * Initialize global analytics service
 */
export function initializeAnalyticsService(
  widgetId: string,
  organizerId: string,
  eventId?: string
): AnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsService(widgetId, organizerId, eventId);
  }
  return analyticsServiceInstance;
}

/**
 * Get global analytics service instance
 */
export function getAnalyticsService(): AnalyticsService | null {
  return analyticsServiceInstance;
}
