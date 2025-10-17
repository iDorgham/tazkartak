export enum PaymentMethod {
  PAYMOB = 'PAYMOB',
  FAWRY = 'FAWRY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface Payment {
  id: string;
  ticketId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  referenceNumber?: string;
  paymentUrl?: string;
  gatewayResponse?: any;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  ticket?: any;
}

export interface PayMobPaymentRequest {
  amount: number;
  currency: string;
  integration_id: number;
  order_id: string;
  billing_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    country: string;
    city: string;
    street: string;
    building: string;
    floor: string;
    apartment: string;
  };
  shipping_data?: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    country: string;
    city: string;
    street: string;
    building: string;
    floor: string;
    apartment: string;
  };
}

export interface FawryPaymentRequest {
  merchantCode: string;
  merchantRefNum: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  amount: number;
  currencyCode: string;
  language: string;
  description: string;
  chargeItems: Array<{
    itemId: string;
    description: string;
    price: number;
    quantity: number;
  }>;
  paymentExpiry: number;
  returnUrl: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    paymentId: string;
    paymentUrl?: string;
    referenceNumber?: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
  };
}

export interface PaymentWebhook {
  type: string;
  obj: {
    id: number;
    amount_cents: number;
    currency: string;
    integration_id: number;
    order: {
      id: number;
      created_at: string;
      delivery_needed: boolean;
      merchant: {
        id: number;
        created_at: string;
        phones: string[];
        company_emails: string[];
        company_name: string;
        state: string;
        country: string;
        city: string;
        postal_code: string;
        street: string;
      };
      collector: any;
      amount_cents: number;
      shipping_data: any;
      currency: string;
      is_payment_locked: boolean;
      is_return: boolean;
      is_cancel: boolean;
      is_returned: boolean;
      is_canceled: boolean;
      merchant_order_id: string;
      wallet_notification: any;
      paid_amount_cents: number;
      notify_user_with_email: boolean;
      items: any[];
      order_url: string;
      commission_fees: number;
      delivery_fees: number;
      delivery_vat_cents: number;
      payment_method: string;
      merchant_staff_tag: any;
      api_source: string;
      data: any;
      token: string;
      url: string;
    };
    created_at: string;
    is_3d_secure: boolean;
    is_auth: boolean;
    is_capture: boolean;
    is_standalone_payment: boolean;
    is_voided: boolean;
    is_refunded: boolean;
    is_3d_secure_valid: boolean;
    integration_id: number;
    is_void: boolean;
    is_standalone: boolean;
    is_refund: boolean;
    is_capture_error: boolean;
    is_auth_error: boolean;
    is_void_error: boolean;
    is_refund_error: boolean;
    error_occured: boolean;
    is_live: boolean;
    other_endpoint_reference: string;
    refunded_amount_cents: number;
    captured_amount: number;
    owner: number;
    parent_transaction: any;
    pending: boolean;
    source_data: {
      pan: string;
      type: string;
      sub_type: string;
    };
    success: boolean;
  };
}
