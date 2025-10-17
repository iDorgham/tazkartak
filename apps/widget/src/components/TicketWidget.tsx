import React, { useState, useEffect, useCallback } from 'react';
import { initializeAnalyticsService, getAnalyticsService } from '../services/analytics.service';
import { initializeRealtimeService } from '../services/realtime.service';
import { TicketTypeSelector } from './TicketTypeSelector';
import { CheckoutForm } from './CheckoutForm';
import { PaymentSelection } from './PaymentSelection';
import { ConfirmationView } from './ConfirmationView';
import { ErrorBoundary } from './ErrorBoundary';
import { logger } from '../utils/logger.util';
import { Event, TicketType, WidgetConfig } from '../types/widget.types';


export interface TicketWidgetProps {
  config: WidgetConfig;
  serverUrl?: string;
}

export const TicketWidget: React.FC<TicketWidgetProps> = ({ 
  config, 
  serverUrl = window.location.origin 
}) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<'select' | 'checkout' | 'payment' | 'confirmation'>('select');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeEnabled] = useState<boolean>(config.realTimeUpdates || false);

  // Initialize analytics and real-time services
  useEffect(() => {
    try {
      const widgetId = `widget_${config.eventId}_${Date.now()}`;
      
      // Initialize analytics service
      initializeAnalyticsService(widgetId, config.apiKey, config.eventId);
      
      // Initialize real-time service if enabled
      if (realtimeEnabled) {
        const realtimeService = initializeRealtimeService(widgetId, config.apiKey, config.eventId, serverUrl);
        
        // Listen for real-time updates
        const ticketAvailabilityHandler = (event: any) => {
          handleTicketAvailabilityUpdate(event);
        };
        
        const eventStatusHandler = (event: any) => {
          handleEventStatusUpdate(event);
        };
        
        window.addEventListener('tazkartak:ticketAvailability', ticketAvailabilityHandler);
        window.addEventListener('tazkartak:eventStatus', eventStatusHandler);
        
        return () => {
          window.removeEventListener('tazkartak:ticketAvailability', ticketAvailabilityHandler);
          window.removeEventListener('tazkartak:eventStatus', eventStatusHandler);
          realtimeService?.disconnect();
        };
      }
    } catch (error) {
      logger.error('Failed to initialize services:', error);
    }
  }, [config, realtimeEnabled, serverUrl]);

  // Load event data
  useEffect(() => {
    loadEventData();
  }, [config.eventId, config.apiKey]);

  // Apply custom CSS
  useEffect(() => {
    if (config.customCSS) {
      const styleId = 'tazkartak-widget-custom-css';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = config.customCSS;
    }
  }, [config.customCSS]);

  /**
   * Load event data from API
   */
  const loadEventData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${serverUrl}/api/public/events/${config.eventId}`, {
        headers: {
          'X-API-Key': config.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load event: ${response.status} ${response.statusText}`);
      }

      const eventData = await response.json();
      setEvent(eventData.data);

      // Track event load
      getAnalyticsService()?.trackView();

      logger.info('Event data loaded successfully', eventData);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load event data';
      setError(errorMessage);
      
      // Track error
      getAnalyticsService()?.trackError('event_load_error', {
        eventId: config.eventId,
        error: errorMessage,
      });
      
      logger.error('Failed to load event data:', error);
    } finally {
      setLoading(false);
    }
  }, [config.eventId, config.apiKey, serverUrl]);

  /**
   * Handle ticket type selection
   */
  const handleTicketSelection = useCallback((ticketType: TicketType, selectedQuantity: number) => {
    setSelectedTicketType(ticketType);
    setQuantity(selectedQuantity);
    setCurrentStep('checkout');

    // Track ticket selection
    getAnalyticsService()?.trackTicketSelection(ticketType.id, selectedQuantity);
  }, []);

  /**
   * Handle checkout start
   */
  const handleCheckoutStart = useCallback(() => {
    setCurrentStep('payment');

    // Track checkout start
    getAnalyticsService()?.trackCheckoutStart(
      selectedTicketType?.id,
      quantity,
      selectedTicketType ? selectedTicketType.price * quantity : 0
    );
  }, [selectedTicketType, quantity]);

  /**
   * Handle payment completion
   */
  const handlePaymentComplete = useCallback((_paymentData: any) => {
    setCurrentStep('confirmation');

    // Track checkout completion
    getAnalyticsService()?.trackCheckoutComplete(
      selectedTicketType?.id,
      quantity,
      selectedTicketType ? selectedTicketType.price * quantity : 0
    );

    // Track purchase
    if (selectedTicketType) {
      getAnalyticsService()?.trackPurchase(
        selectedTicketType.id,
        quantity,
        selectedTicketType.price * quantity
      );
    }
  }, [selectedTicketType, quantity]);

  /**
   * Handle ticket availability updates from real-time service
   */
  const handleTicketAvailabilityUpdate = useCallback((event: CustomEvent) => {
    const { ticketTypeId, available } = event.detail;
    
    if (event && event.detail) {
      setEvent(prevEvent => {
        if (!prevEvent) return prevEvent;
        
        const updatedTicketTypes = prevEvent.ticketTypes.map(ticketType => {
          if (ticketType.id === ticketTypeId) {
            return { ...ticketType, available };
          }
          return ticketType;
        });

        return { ...prevEvent, ticketTypes: updatedTicketTypes };
      });
    }
  }, []);

  /**
   * Handle event status updates from real-time service
   */
  const handleEventStatusUpdate = useCallback((event: CustomEvent) => {
    const { status } = event.detail;
    
    if (event && event.detail) {
      setEvent(prevEvent => {
        if (!prevEvent) return prevEvent;
        return { ...prevEvent, status };
      });
    }
  }, []);

  /**
   * Reset to ticket selection
   */
  const handleReset = useCallback(() => {
    setSelectedTicketType(null);
    setQuantity(1);
    setCurrentStep('select');
  }, []);

  if (loading) {
    return (
      <div className="tazkartak-widget-loading">
        <div className="loading-spinner"></div>
        <p>Loading event...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tazkartak-widget-error">
        <h3>Unable to Load Event</h3>
        <p>{error}</p>
        <button onClick={loadEventData}>Retry</button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="tazkartak-widget-error">
        <h3>Event Not Found</h3>
        <p>The requested event could not be found.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div 
        className={`tazkartak-widget tazkartak-widget--${config.layout || 'standard'}`}
        data-theme-colors={JSON.stringify({
          primaryColor: config.theme?.primaryColor || '#1976d2',
          secondaryColor: config.theme?.secondaryColor || '#dc004e',
          backgroundColor: config.theme?.backgroundColor || '#ffffff',
          fontFamily: config.theme?.fontFamily || 'Roboto, sans-serif',
          borderRadius: config.theme?.borderRadius || '8px',
        })}
      >
        {currentStep === 'select' && (
          <TicketTypeSelector
            event={event}
            onTicketSelect={handleTicketSelection}
            realtimeEnabled={realtimeEnabled}
            config={config}
          />
        )}

        {currentStep === 'checkout' && selectedTicketType && (
          <CheckoutForm
            event={event}
            selectedTickets={{ [selectedTicketType.id]: quantity }}
            onContinue={handleCheckoutStart}
            onBack={handleReset}
            config={config}
          />
        )}

        {currentStep === 'payment' && selectedTicketType && (
          <PaymentSelection
            event={event}
            selectedTickets={{ [selectedTicketType.id]: quantity }}
            onPaymentComplete={handlePaymentComplete}
            onBack={() => setCurrentStep('checkout')}
            config={config}
          />
        )}

        {currentStep === 'confirmation' && (
          <ConfirmationView
            event={event}
            selectedTickets={{ [selectedTicketType!.id]: quantity }}
            onNewPurchase={handleReset}
            config={config}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default TicketWidget;