export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  price: number;
  status: TicketStatus;
  qrCodeData: string;
  isScanned: boolean;
  scannedAt?: string;
  createdAt: string;
  updatedAt: string;
  event?: Event;
  user?: User;
  payments?: Payment[];
  qrScans?: QRScan[];
}

export type TicketStatus = 'PENDING' | 'CONFIRMED' | 'USED' | 'CANCELLED' | 'REFUNDED';

export interface CreateTicketInput {
  eventId: string;
  userId: string;
  price: number;
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  qrCodeData?: string;
}

export interface TicketFilters {
  eventId?: string;
  userId?: string;
  status?: TicketStatus;
  isScanned?: boolean;
  page?: number;
  limit?: number;
}

export interface TicketStats {
  totalTickets: number;
  pendingTickets: number;
  confirmedTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  refundedTickets: number;
  totalRevenue: number;
}

export interface QRScan {
  id: string;
  ticketId: string;
  scannedBy?: string;
  scannedAt: string;
  isValid: boolean;
  message?: string;
}

export interface TicketValidationResult {
  isValid: boolean;
  ticket?: Ticket;
  message: string;
  scannedAt: string;
}

export interface TicketPurchaseData {
  eventId: string;
  quantity: number;
  paymentMethod: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface TicketPurchaseResult {
  success: boolean;
  tickets: Ticket[];
  paymentId: string;
  message: string;
}

// Import from other types (to avoid circular dependencies)
interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  price: number;
  status: string;
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  gateway: string;
  transactionId?: string;
  createdAt: string;
}
