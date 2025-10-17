import React from 'react';
import { Event, WidgetConfig } from '../types/widget.types';

interface PaymentSelectionProps {
  event: Event;
  selectedTickets: { [ticketTypeId: string]: number };
  onPaymentComplete: (paymentData: any) => void;
  onBack: () => void;
  config: WidgetConfig;
}

export const PaymentSelection: React.FC<PaymentSelectionProps> = ({
  event,
  selectedTickets,
  onPaymentComplete,
  onBack,
  config,
}) => {
  return (
    <div className="payment-selection">
      <h3>Payment Selection</h3>
      <p>Event: {event.name}</p>
      <p>Selected Tickets: {JSON.stringify(selectedTickets)}</p>
      <button onClick={onBack}>Back</button>
      <button onClick={() => onPaymentComplete({})}>Complete Payment</button>
    </div>
  );
};

export default PaymentSelection;