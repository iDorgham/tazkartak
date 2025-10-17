export interface Payment {
  id: string;
  userId: string;
  ticketId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  transactionId?: string;
  paymentDetails?: any;
  createdAt: string;
  updatedAt: string;
  user?: User;
  ticket?: Ticket;
  subscription?: Subscription;
}

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentGateway = 'PAYMOB' | 'FAWRY' | 'STRIPE';

export interface InitiatePaymentInput {
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  ticketId?: string;
  subscriptionId?: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface PaymentResponse {
  paymentId: string;
  status: PaymentStatus;
  redirectUrl?: string;
  transactionId?: string;
  message: string;
}

export interface PaymentCallback {
  gateway: PaymentGateway;
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paymentDetails: any;
}

export interface PaymentFilters {
  userId?: string;
  status?: PaymentStatus;
  gateway?: PaymentGateway;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaymentStats {
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedPayments: number;
  totalRevenue: number;
  averageTransactionValue: number;
}

export interface PaymentAnalytics {
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
  gatewayBreakdown: Array<{
    gateway: PaymentGateway;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  statusBreakdown: Array<{
    status: PaymentStatus;
    count: number;
    percentage: number;
  }>;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // If not provided, refund full amount
  reason: string;
}

export interface RefundResponse {
  refundId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  message: string;
}

// PayMob specific types
export interface PayMobPaymentData {
  apiKey: string;
  integrationId: string;
  amount: number;
  currency: string;
  orderId: string;
  billingData: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    street: string;
    city: string;
    country: string;
    state: string;
    postal_code: string;
  };
}

export interface PayMobResponse {
  token: string;
  redirectUrl: string;
}

// Fawry specific types
export interface FawryPaymentData {
  merchantCode: string;
  merchantRefNum: string;
  customerProfileId: string;
  customerMobile: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  currencyCode: string;
  language: string;
  chargeItems: Array<{
    itemId: string;
    description: string;
    price: number;
    quantity: number;
  }>;
}

export interface FawryResponse {
  referenceNumber: string;
  merchantRefNumber: string;
  paymentMethod: string;
  redirectUrl: string;
}

// Import from other types (to avoid circular dependencies)
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface Ticket {
  id: string;
  eventId: string;
  price: number;
  status: string;
}

interface Subscription {
  id: string;
  packageTier: string;
  price: number;
  status: string;
}
