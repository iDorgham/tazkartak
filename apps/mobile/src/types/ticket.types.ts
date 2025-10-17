export interface Ticket {
  id: string;
  eventId: string;
  buyerId: string;
  qrCode: string;
  price: number;
  currency: string;
  status: TicketStatus;
  purchaseDate?: string;
  usedDate?: string;
  transferTo?: string;
  transferDate?: string;
  refundReason?: string;
  refundDate?: string;
  createdAt: string;
  updatedAt: string;
  event?: Event;
  buyer?: User;
}

export type TicketStatus = 'AVAILABLE' | 'SOLD' | 'USED' | 'CANCELLED' | 'REFUNDED';

export interface CreateTicketInput {
  eventId: string;
  quantity: number;
  paymentMethod: string;
  promoCode?: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  eventId?: string;
  buyerId?: string;
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
  page?: number;
  limit?: number;
}

export interface TicketTransferRequest {
  ticketId: string;
  email: string;
  message?: string;
}

export interface TicketRefundRequest {
  ticketId: string;
  reason: string;
}

export interface QRValidationResult {
  isValid: boolean;
  ticket?: Ticket;
  error?: string;
  message?: string;
}

export interface TicketAnalytics {
  totalTickets: number;
  soldTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  refundedTickets: number;
  totalRevenue: number;
  averagePrice: number;
  conversionRate: number;
}

// Import from other types (to avoid circular dependencies)
interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  imageUrl?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

