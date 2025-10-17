export enum TicketStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface Ticket {
  id: string;
  eventId: string;
  buyerId?: string;
  qrCode: string;
  price: number;
  currency: string;
  status: TicketStatus;
  purchaseDate?: Date;
  usedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  event?: any;
  buyer?: any;
  payment?: any;
}

export interface CreateTicketRequest {
  eventId: string;
  quantity: number;
  buyerInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface PurchaseTicketRequest {
  eventId: string;
  quantity: number;
  paymentMethod: 'PAYMOB' | 'FAWRY';
  buyerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface QRValidationRequest {
  qrCode: string;
}

export interface QRValidationResponse {
  success: boolean;
  message: string;
  data: {
    valid: boolean;
    ticket?: Ticket;
    event?: any;
    buyer?: any;
    alreadyUsed?: boolean;
    expired?: boolean;
  };
}

export interface TicketFilters {
  eventId?: string;
  buyerId?: string;
  status?: TicketStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface TicketResponse {
  success: boolean;
  message: string;
  data: {
    tickets: Ticket[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}
