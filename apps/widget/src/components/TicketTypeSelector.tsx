import React, { useState, useEffect } from 'react';
import { getAnalyticsService } from '../services/analytics.service';
import { TicketType, Event, WidgetConfig } from './TicketWidget';

interface TicketTypeSelectorProps {
  event: Event;
  onTicketSelect: (ticketType: TicketType, quantity: number) => void;
  realtimeEnabled: boolean;
  config: WidgetConfig;
}

export const TicketTypeSelector: React.FC<TicketTypeSelectorProps> = ({
  event,
  onTicketSelect,
  realtimeEnabled,
  config,
}) => {
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Listen for real-time ticket availability updates
  useEffect(() => {
    if (realtimeEnabled) {
      const handleTicketAvailabilityUpdate = (event: CustomEvent) => {
        // This will be handled by the parent component
        // We just need to re-render when availability changes
        setSelectedTicketType(null);
      };

      window.addEventListener('tazkartak:ticketAvailability', handleTicketAvailabilityUpdate);
      
      return () => {
        window.removeEventListener('tazkartak:ticketAvailability', handleTicketAvailabilityUpdate);
      };
    }
  }, [realtimeEnabled]);

  /**
   * Handle ticket type selection
   */
  const handleTicketTypeSelect = (ticketType: TicketType) => {
    if (ticketType.available <= 0) {
      getAnalyticsService()?.trackError('ticket_unavailable', {
        ticketTypeId: ticketType.id,
        requestedQuantity: quantity,
        available: ticketType.available,
      });
      return;
    }

    setSelectedTicketType(ticketType);
    setQuantity(1); // Reset quantity when selecting new ticket type

    // Track ticket type click
    getAnalyticsService()?.trackCustomEvent('ticket_type_click', {
      ticketTypeId: ticketType.id,
      ticketTypeName: ticketType.name,
      price: ticketType.price,
    });
  };

  /**
   * Handle quantity change
   */
  const handleQuantityChange = (newQuantity: number) => {
    if (selectedTicketType && newQuantity > 0 && newQuantity <= selectedTicketType.available) {
      setQuantity(newQuantity);
    }
  };

  /**
   * Handle proceed to checkout
   */
  const handleProceedToCheckout = async () => {
    if (!selectedTicketType) return;

    setLoading(true);
    
    try {
      // Track checkout initiation
      getAnalyticsService()?.trackCustomEvent('checkout_initiated', {
        ticketTypeId: selectedTicketType.id,
        quantity,
        totalAmount: selectedTicketType.price * quantity,
      });

      // Call parent handler
      onTicketSelect(selectedTicketType, quantity);
    } catch (error) {
      getAnalyticsService()?.trackError('checkout_initiation_error', {
        ticketTypeId: selectedTicketType.id,
        quantity,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format price based on currency
   */
  const formatPrice = (price: number): string => {
    const currency = config.currency || 'EGP';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'EGP' ? 'EGP' : 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="ticket-type-selector">
      {/* Event Header */}
      <div className="event-header">
        {event.image && (
          <div className="event-image">
            <img src={event.image} alt={event.name} />
          </div>
        )}
        
        <div className="event-info">
          <h2 className="event-title">{event.name}</h2>
          
          {config.showEventDescription && event.description && (
            <p className="event-description">{event.description}</p>
          )}
          
          <div className="event-details">
            <div className="event-date">
              <span className="label">Date:</span>
              <span className="value">{formatDate(event.date)}</span>
            </div>
            
            {config.showVenueInfo && (
              <div className="event-location">
                <span className="label">Location:</span>
                <span className="value">{event.location}</span>
              </div>
            )}
          </div>

          {realtimeEnabled && (
            <div className="realtime-indicator">
              <span className="live-dot"></span>
              <span>Live Updates</span>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Types */}
      <div className="ticket-types">
        <h3>Select Tickets</h3>
        
        {event.ticketTypes.length === 0 ? (
          <div className="no-tickets">
            <p>No tickets available for this event.</p>
          </div>
        ) : (
          <div className="ticket-types-grid">
            {event.ticketTypes.map((ticketType) => (
              <div
                key={ticketType.id}
                className={`ticket-type-card ${
                  selectedTicketType?.id === ticketType.id ? 'selected' : ''
                } ${
                  ticketType.available <= 0 ? 'sold-out' : ''
                }`}
                data-ticket-type={ticketType.id}
                onClick={() => handleTicketTypeSelect(ticketType)}
              >
                <div className="ticket-type-header">
                  <h4 className="ticket-type-name">{ticketType.name}</h4>
                  <div className="ticket-type-price">
                    {formatPrice(ticketType.price)}
                  </div>
                </div>

                {ticketType.description && (
                  <p className="ticket-type-description">{ticketType.description}</p>
                )}

                {ticketType.features && ticketType.features.length > 0 && (
                  <ul className="ticket-type-features">
                    {ticketType.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                )}

                <div className="ticket-type-availability">
                  {ticketType.available <= 0 ? (
                    <span className="sold-out">Sold Out</span>
                  ) : ticketType.available <= 10 ? (
                    <span className="limited">Only {ticketType.available} left</span>
                  ) : (
                    <span className="available">{ticketType.available} available</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quantity Selection */}
      {selectedTicketType && selectedTicketType.available > 0 && (
        <div className="quantity-selection">
          <label htmlFor="quantity">Quantity:</label>
          <div className="quantity-controls">
            <button
              type="button"
              className="quantity-btn"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              -
            </button>
            <input
              id="quantity"
              type="number"
              min="1"
              max={selectedTicketType.available}
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="quantity-input"
            />
            <button
              type="button"
              className="quantity-btn"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= selectedTicketType.available}
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Checkout Button */}
      {selectedTicketType && selectedTicketType.available > 0 && (
        <div className="checkout-section">
          <div className="total-summary">
            <div className="total-line">
              <span>{selectedTicketType.name} × {quantity}</span>
              <span>{formatPrice(selectedTicketType.price * quantity)}</span>
            </div>
            <div className="total-line total">
              <span>Total</span>
              <span>{formatPrice(selectedTicketType.price * quantity)}</span>
            </div>
          </div>
          
          <button
            type="button"
            className="checkout-btn"
            onClick={handleProceedToCheckout}
            disabled={loading}
            data-action="checkout"
          >
            {loading ? 'Processing...' : 'Proceed to Checkout'}
          </button>
        </div>
      )}

      {/* Event Status */}
      {event.status === 'cancelled' && (
        <div className="event-status cancelled">
          <p>This event has been cancelled.</p>
        </div>
      )}

      {event.status === 'completed' && (
        <div className="event-status completed">
          <p>This event has already taken place.</p>
        </div>
      )}
    </div>
  );
};

export default TicketTypeSelector;