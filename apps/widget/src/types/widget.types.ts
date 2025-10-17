export interface WidgetConfig {
  eventId: string;
  apiKey: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    borderRadius?: string;
    buttonStyle?: 'rounded' | 'square' | 'pill';
  };
  customCSS?: string;
  layout?: 'compact' | 'standard' | 'expanded';
  language?: string;
  currency?: string;
  showVenueInfo?: boolean;
  showEventDescription?: boolean;
  realTimeUpdates?: boolean;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  venue?: {
    name: string;
    address: string;
    city: string;
    capacity?: number;
  };
  ticketTypes: TicketType[];
  capacity: number;
  soldTickets: number;
  status: 'draft' | 'published' | 'live' | 'completed' | 'cancelled';
}

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  availableQuantity: number;
  maxPerOrder: number;
  isActive: boolean;
}

export interface PurchaseData {
  ticketTypeId: string;
  quantity: number;
  buyerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  paymentMethod: string;
}

export interface PurchaseResult {
  success: boolean;
  tickets?: Ticket[];
  paymentUrl?: string;
  qrCode?: string;
  transactionId?: string;
  error?: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  ticketTypeId: string;
  buyerId: string;
  qrCode: string;
  purchaseDate: string;
  status: 'active' | 'used' | 'refunded' | 'cancelled';
}

export interface PaymentMethod {
  code: string;
  name: string;
  description: string;
  gateway: string;
  icon?: string;
}

export interface WidgetState {
  step: 'loading' | 'event' | 'tickets' | 'checkout' | 'payment' | 'confirmation' | 'error';
  event?: Event;
  selectedTickets: { [ticketTypeId: string]: number };
  purchaseData?: PurchaseData;
  paymentUrl?: string;
  error?: string;
  loading: boolean;
}

export interface PostMessageData {
  type: string;
  data?: any;
  config?: any;
}

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}
