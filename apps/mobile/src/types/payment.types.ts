export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  gateway: PaymentGateway;
  transactionId?: string;
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, any>;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  INSTALLMENT = 'installment',
}

export enum PaymentGateway {
  PAYMOB = 'paymob',
  FAWRY = 'fawry',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

export interface CreatePaymentInput {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  gateway: PaymentGateway;
  customerInfo: CustomerInfo;
  items: PaymentItem[];
  metadata?: Record<string, any>;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface PaymentItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface UpdatePaymentInput {
  status?: PaymentStatus;
  transactionId?: string;
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, any>;
  failureReason?: string;
  completedAt?: string;
}

export interface PaymentFilters {
  status?: PaymentStatus[];
  gateway?: PaymentGateway[];
  paymentMethod?: PaymentMethod[];
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  orderId?: string;
}

export interface PaymentResponse {
  success: boolean;
  payment?: Payment;
  error?: string;
  redirectUrl?: string;
  paymentToken?: string;
}

export interface PaymentCallback {
  paymentId: string;
  status: PaymentStatus;
  transactionId?: string;
  gatewayTransactionId?: string;
  amount?: number;
  currency?: string;
  signature?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// PayMob specific types
export interface PayMobConfig {
  apiKey: string;
  integrationId: string;
  iframeId: string;
  cardIntegrationId: string;
  walletIntegrationId: string;
  kioskIntegrationId: string;
  currency: string;
  sandboxMode: boolean;
}

export interface PayMobPaymentRequest {
  auth_token: string;
  amount_cents: number;
  currency: string;
  delivery_needed: boolean;
  items: PayMobItem[];
  shipping_data?: PayMobShippingData;
  integration_id: number;
  order_id: string;
  customer: PayMobCustomer;
  merchant_order_id: string;
  metadata?: Record<string, any>;
}

export interface PayMobItem {
  name: string;
  amount_cents: number;
  description: string;
  quantity: number;
}

export interface PayMobShippingData {
  apartment: string;
  email: string;
  floor: string;
  first_name: string;
  street: string;
  building: string;
  phone_number: string;
  postal_code: string;
  extra_description: string;
  city: string;
  country: string;
  last_name: string;
  state: string;
}

export interface PayMobCustomer {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

export interface PayMobPaymentKeyRequest {
  auth_token: string;
  amount_cents: number;
  expiration: number;
  order_id: string;
  billing_data: PayMobBillingData;
  currency: string;
  integration_id: number;
  lock_order_when_paid: boolean;
}

export interface PayMobBillingData {
  apartment: string;
  email: string;
  floor: string;
  first_name: string;
  street: string;
  building: string;
  phone_number: string;
  shipping_method: string;
  postal_code: string;
  city: string;
  country: string;
  last_name: string;
  state: string;
}

export interface PayMobResponse {
  token: string;
  iframe_url?: string;
  redirect_url?: string;
}

// Fawry specific types
export interface FawryConfig {
  merchantCode: string;
  merchantRefNum: string;
  customerProfileId: string;
  merchantSecretKey: string;
  signature: string;
  sandboxMode: boolean;
}

export interface FawryPaymentRequest {
  merchantCode: string;
  merchantRefNum: string;
  customerProfileId: string;
  customerMobile: string;
  customerEmail: string;
  amount: number;
  currencyCode: string;
  language: string;
  chargeItems: FawryChargeItem[];
  signature: string;
  paymentMethod: string;
  description?: string;
  paymentExpiry?: number;
  allowValueEdit?: boolean;
  merchantExtra?: string;
  merchantExtra1?: string;
  merchantExtra2?: string;
  merchantExtra3?: string;
  merchantExtra4?: string;
  merchantExtra5?: string;
  payMode?: string;
}

export interface FawryChargeItem {
  itemId: string;
  description: string;
  price: number;
  quantity: number;
  width?: number;
  height?: number;
  length?: number;
  weight?: number;
}

export interface FawryResponse {
  type: string;
  referenceNumber: string;
  merchantRefNumber: string;
  orderStatus: string;
  paymentMethod: string;
  paymentRefNumber?: string;
  expirationTime?: string;
  signature?: string;
  url?: string;
}

// WebView Payment types
export interface WebViewPaymentRequest {
  url: string;
  headers?: Record<string, string>;
  postData?: string;
  timeout?: number;
}

export interface WebViewPaymentResponse {
  success: boolean;
  url?: string;
  data?: Record<string, any>;
  error?: string;
}

// Payment session types
export interface PaymentSession {
  id: string;
  paymentId: string;
  sessionToken: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'completed' | 'failed';
  gateway: PaymentGateway;
  paymentMethod: PaymentMethod;
}

export interface PaymentSessionRequest {
  paymentId: string;
  gateway: PaymentGateway;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  customerInfo: CustomerInfo;
  items: PaymentItem[];
  returnUrl?: string;
  cancelUrl?: string;
}

// Payment validation types
export interface PaymentValidation {
  isValid: boolean;
  signature?: string;
  timestamp?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

// Payment analytics types
export interface PaymentAnalytics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalAmount: number;
  averageAmount: number;
  successRate: number;
  gatewayStats: Record<PaymentGateway, {
    totalTransactions: number;
    successfulTransactions: number;
    totalAmount: number;
    successRate: number;
  }>;
  methodStats: Record<PaymentMethod, {
    totalTransactions: number;
    successfulTransactions: number;
    totalAmount: number;
    successRate: number;
  }>;
}