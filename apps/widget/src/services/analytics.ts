import { AnalyticsEvent } from '../types/widget.types';
import { sendAnalytics } from '../utils/postMessage';

class AnalyticsService {
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  track(event: string, properties?: Record<string, any>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        sessionDuration: Date.now() - this.startTime,
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer
      }
    };

    // Send to parent window
    sendAnalytics(event, analyticsEvent.properties);

    // Send to backend if available
    this.sendToBackend(analyticsEvent);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', analyticsEvent);
    }
  }

  private async sendToBackend(event: AnalyticsEvent): Promise<void> {
    try {
      // Use sendBeacon for reliable delivery
      const data = JSON.stringify(event);
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/widget', data);
      } else {
        // Fallback to fetch
        fetch('/api/analytics/widget', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
          keepalive: true
        }).catch(error => {
          console.warn('Failed to send analytics to backend:', error);
        });
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  // Widget-specific tracking methods
  trackWidgetLoad(config: { eventId: string; hasApiKey: boolean }): void {
    this.track('widget_loaded', config);
  }

  trackEventView(eventId: string, eventName: string): void {
    this.track('event_viewed', {
      eventId,
      eventName
    });
  }

  trackTicketSelection(ticketTypeId: string, quantity: number, price: number): void {
    this.track('ticket_selected', {
      ticketTypeId,
      quantity,
      price,
      totalAmount: quantity * price
    });
  }

  trackCheckoutStart(selectedTickets: Record<string, number>): void {
    this.track('checkout_started', {
      selectedTickets,
      ticketCount: Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)
    });
  }

  trackPaymentInitiated(paymentMethod: string, amount: number): void {
    this.track('payment_initiated', {
      paymentMethod,
      amount
    });
  }

  trackPurchaseComplete(transactionId: string, amount: number, ticketCount: number): void {
    this.track('purchase_completed', {
      transactionId,
      amount,
      ticketCount,
      success: true
    });
  }

  trackPurchaseError(error: string, step: string): void {
    this.track('purchase_error', {
      error,
      step,
      success: false
    });
  }

  trackQRCodeGenerated(ticketCount: number): void {
    this.track('qr_code_generated', {
      ticketCount
    });
  }

  trackError(error: Error, context: string): void {
    this.track('widget_error', {
      error: error.message,
      context,
      stack: error.stack
    });
  }

  trackUserInteraction(action: string, element: string): void {
    this.track('user_interaction', {
      action,
      element
    });
  }

  trackPageView(step: string): void {
    this.track('page_view', {
      step,
      path: step
    });
  }

  trackConversion(eventId: string, amount: number): void {
    this.track('conversion', {
      eventId,
      amount,
      currency: 'EGP'
    });
  }
}

export const analytics = new AnalyticsService();
