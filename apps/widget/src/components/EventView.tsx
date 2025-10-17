import React from 'react';
import { Event, WidgetConfig } from '../types/widget.types';
import { TicketTypeSelector } from './TicketTypeSelector';
import { formatDate, formatCurrency } from '../utils/formatters';

interface EventViewProps {
  event: Event;
  selectedTickets: { [ticketTypeId: string]: number };
  onTicketSelection: (ticketTypeId: string, quantity: number) => void;
  onProceedToCheckout: () => void;
  config: WidgetConfig;
}

export const EventView: React.FC<EventViewProps> = ({
  event,
  selectedTickets,
  onTicketSelection,
  onProceedToCheckout,
  config
}) => {
  const totalSelected = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = event.ticketTypes.reduce((sum, ticketType) => {
    const quantity = selectedTickets[ticketType.id] || 0;
    return sum + (ticketType.price * quantity);
  }, 0);

  const availableTickets = event.ticketTypes.reduce((sum, ticketType) => {
    return sum + ticketType.availableQuantity;
  }, 0);

  const isEventActive = event.status === 'published' || event.status === 'live';
  const isSoldOut = availableTickets === 0;
  const isEventExpired = new Date(event.endDate) < new Date();

  return (
    <div className="tazkartak-card tazkartak-fade-in">
      <div className="tazkartak-card-header">
        {event.imageUrl && (
          <div style={{ marginBottom: '1rem' }}>
            <img
              src={event.imageUrl}
              alt={event.name}
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: 'var(--tazkartak-border-radius)'
              }}
            />
          </div>
        )}
        
        <h1 className="tazkartak-title">{event.name}</h1>
        
        {config.showEventDescription && event.description && (
          <p className="tazkartak-text">{event.description}</p>
        )}

        <div className="tazkartak-grid tazkartak-grid-2" style={{ marginTop: '1rem' }}>
          <div>
            <strong>Date & Time:</strong>
            <p>{formatDate(event.startDate)}</p>
            {event.startDate !== event.endDate && (
              <p>Ends: {formatDate(event.endDate)}</p>
            )}
          </div>
          
          {config.showVenueInfo && event.venue && (
            <div>
              <strong>Venue:</strong>
              <p>{event.venue.name}</p>
              <p className="tazkartak-text-muted">
                {event.venue.address}, {event.venue.city}
              </p>
              {event.venue.capacity && (
                <p className="tazkartak-text-muted">
                  Capacity: {event.venue.capacity.toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <div className="tazkartak-flex tazkartak-justify-between tazkartak-items-center">
            <div>
              <span className="tazkartak-status tazkartak-status-info">
                {event.status.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="tazkartak-text-muted">
                {availableTickets.toLocaleString()} tickets available
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="tazkartak-card-body">
        {!isEventActive && (
          <div style={{ 
            background: 'var(--tazkartak-warning)', 
            color: 'white', 
            padding: '1rem', 
            borderRadius: 'var(--tazkartak-border-radius)',
            marginBottom: '1rem'
          }}>
            This event is not currently available for purchase.
          </div>
        )}

        {isEventExpired && (
          <div style={{ 
            background: 'var(--tazkartak-error)', 
            color: 'white', 
            padding: '1rem', 
            borderRadius: 'var(--tazkartak-border-radius)',
            marginBottom: '1rem'
          }}>
            This event has already ended.
          </div>
        )}

        {isSoldOut && isEventActive && (
          <div style={{ 
            background: 'var(--tazkartak-error)', 
            color: 'white', 
            padding: '1rem', 
            borderRadius: 'var(--tazkartak-border-radius)',
            marginBottom: '1rem'
          }}>
            This event is sold out.
          </div>
        )}

        {isEventActive && !isSoldOut && !isEventExpired && (
          <>
            <TicketTypeSelector
              ticketTypes={event.ticketTypes}
              selectedTickets={selectedTickets}
              onTicketSelection={onTicketSelection}
            />

            {totalSelected > 0 && (
              <div style={{ 
                background: 'var(--tazkartak-border)', 
                padding: '1rem', 
                borderRadius: 'var(--tazkartak-border-radius)',
                marginTop: '1rem'
              }}>
                <div className="tazkartak-flex tazkartak-justify-between tazkartak-items-center">
                  <div>
                    <strong>{totalSelected} ticket{totalSelected !== 1 ? 's' : ''} selected</strong>
                  </div>
                  <div>
                    <strong>{formatCurrency(totalPrice, config.currency || 'EGP')}</strong>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isEventActive && !isSoldOut && !isEventExpired && (
        <div className="tazkartak-card-footer">
          <button
            className="tazkartak-btn tazkartak-btn-primary"
            onClick={onProceedToCheckout}
            disabled={totalSelected === 0}
            style={{ width: '100%' }}
          >
            {totalSelected > 0 
              ? `Continue with ${totalSelected} ticket${totalSelected !== 1 ? 's' : ''} - ${formatCurrency(totalPrice, config.currency || 'EGP')}`
              : 'Select tickets to continue'
            }
          </button>
        </div>
      )}
    </div>
  );
};
