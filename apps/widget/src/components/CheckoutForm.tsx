import React from 'react';
import { Event, WidgetConfig } from '../types/widget.types';

interface CheckoutFormProps {
  event: Event;
  selectedTickets: { [ticketTypeId: string]: number };
  onContinue: () => void;
  onBack: () => void;
  config: WidgetConfig;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  event,
  selectedTickets,
  onContinue,
  onBack,
  config,
}) => {
  return (
    <div className="checkout-form">
      <h3>Checkout Form</h3>
      <p>Event: {event.name}</p>
      <p>Selected Tickets: {JSON.stringify(selectedTickets)}</p>
      <button onClick={onBack}>Back</button>
      <button onClick={onContinue}>Continue</button>
    </div>
  );
};

export default CheckoutForm;