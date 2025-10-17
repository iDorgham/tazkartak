import React from 'react';
import { Event, WidgetConfig } from '../types/widget.types';

interface ConfirmationViewProps {
  event: Event;
  selectedTickets: { [ticketTypeId: string]: number };
  onNewPurchase: () => void;
  config: WidgetConfig;
}

export const ConfirmationView: React.FC<ConfirmationViewProps> = ({
  event,
  selectedTickets,
  onNewPurchase,
  config,
}) => {
  return (
    <div className="confirmation-view">
      <h3>Purchase Confirmed!</h3>
      <p>Event: {event.name}</p>
      <p>Selected Tickets: {JSON.stringify(selectedTickets)}</p>
      <button onClick={onNewPurchase}>New Purchase</button>
    </div>
  );
};

export default ConfirmationView;