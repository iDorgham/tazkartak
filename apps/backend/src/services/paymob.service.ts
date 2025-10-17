import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger.util';
import { appConfig } from '../config/app.config';

export interface PayMobAuthResponse {
  token: string;
  profile: {
    id: number;
    username: string;
  };
}

export interface PayMobOrderResponse {
  id: number;
  created_at: string;
  delivery_needed: boolean;
  amount_cents: number;
  currency: string;
  is_payment_locked: boolean;
  is_return: boolean;
  is_cancel: boolean;
  is_returned: boolean;
  is_canceled: boolean;
  merchant: {
    id: number;
    created_at: string;
    emails: string[];
    company_emails: string[];
    company_name: string;
    state: string;
    country: string;
    city: string;
    postal_code: string;
    street: string;
  };
  api_source: string;
  data: any;
}

export interface PayMobPaymentKeyResponse {
  token: string;
}

export interface PayMobPaymentData {
  amount_cents: number;
  currency: string;
  order_id: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  billing_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };
  integration_id: number;
  lock_order_when_paid: boolean;
  expiry: number;
}

export interface PayMobCallbackData {
  amount_cents: number;
  created_at: string;
  currency: string;
  error_occured: boolean;
  has_parent_transaction: boolean;
  id: number;
  integration_id: number;
  is_3d_secure: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_refunded: boolean;
  is_standalone_payment: boolean;
  is_voided: boolean;
  order: {
    id: number;
    created_at: string;
    delivery_needed: boolean;
    merchant: {
      id: number;
      created_at: string;
      emails: string[];
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
    merchant_order_id: string;
    net_amount: number;
    paid_amount_cents: number;
    shipping_details: any;
    tax_amount: number;
    is_payment_locked: boolean;
    is_return: boolean;
    is_cancel: boolean;
    is_returned: boolean;
    is_canceled: boolean;
    merchant_staff_tag: any;
    api_source: string;
    data: any;
  };
  owner: number;
  pending: boolean;
  source_data: {
    pan: string;
    type: string;
    sub_type: string;
  };
  success: boolean;
  captured_amount: number;
  hmac: string;
  data: {
    kiosk_reference_number?: string;
    bill_reference_number?: string;
    wallet_reference_number?: string;
  };
}

class PayMobService {
  private readonly baseURL = 'https://accept.paymob.com/api';
  private readonly apiKey: string;
  private readonly integrationId: number;
  private readonly iframeId: number;
  private readonly hmacSecret: string;

  constructor() {
    this.apiKey = appConfig.payment.paymob.apiKey;
    this.integrationId = appConfig.payment.paymob.integrationId;
    this.iframeId = appConfig.payment.paymob.iframeId;
    this.hmacSecret = appConfig.payment.paymob.hmacSecret;
  }

  /**
   * Authenticate with PayMob API
   */
  async authenticate(): Promise<string> {
    try {
      const response = await axios.post<PayMobAuthResponse>(`${this.baseURL}/auth/tokens`, {
        api_key: this.apiKey,
      });

      logger.info('PayMob authentication successful');
      return response.data.token;
    } catch (error: any) {
      logger.error('PayMob authentication failed:', error.response?.data || error.message);
      throw new Error('PayMob authentication failed');
    }
  }

  /**
   * Create an order in PayMob
   */
  async createOrder(
    authToken: string,
    amount: number,
    currency: string = 'EGP',
    merchantOrderId: string,
    customerData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    }
  ): Promise<PayMobOrderResponse> {
    try {
      const orderData = {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amount * 100, // Convert to cents
        currency,
        merchant_order_id: merchantOrderId,
        items: [
          {
            name: 'Event Ticket',
            amount_cents: amount * 100,
            description: 'Event ticket purchase',
            quantity: 1,
          },
        ],
        shipping_data: {
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          email: customerData.email,
          phone_number: customerData.phone,
          street: 'N/A',
          city: 'Cairo',
          state: 'Cairo',
          country: 'EG',
          postal_code: '00000',
        },
        shipping_details: {
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          email: customerData.email,
          phone_number: customerData.phone,
          street: 'N/A',
          city: 'Cairo',
          state: 'Cairo',
          country: 'EG',
          postal_code: '00000',
        },
      };

      const response = await axios.post<PayMobOrderResponse>(
        `${this.baseURL}/ecommerce/orders`,
        orderData
      );

      logger.info(`PayMob order created: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error('PayMob order creation failed:', error.response?.data || error.message);
      throw new Error('PayMob order creation failed');
    }
  }

  /**
   * Create payment key for iframe integration
   */
  async createPaymentKey(
    authToken: string,
    orderId: number,
    amount: number,
    currency: string,
    customerData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    },
    billingData?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    }
  ): Promise<string> {
    try {
      const paymentData: PayMobPaymentData = {
        auth_token: authToken,
        amount_cents: amount * 100,
        currency,
        order_id: orderId.toString(),
        customer: {
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          email: customerData.email,
          phone_number: customerData.phone,
        },
        billing_data: {
          first_name: billingData?.firstName || customerData.firstName,
          last_name: billingData?.lastName || customerData.lastName,
          email: billingData?.email || customerData.email,
          phone_number: billingData?.phone || customerData.phone,
          street: billingData?.street || 'N/A',
          city: billingData?.city || 'Cairo',
          state: billingData?.state || 'Cairo',
          country: billingData?.country || 'EG',
          postal_code: billingData?.postalCode || '00000',
        },
        integration_id: this.integrationId,
        lock_order_when_paid: false,
        expiry: 3600, // 1 hour
      };

      const response = await axios.post<PayMobPaymentKeyResponse>(
        `${this.baseURL}/acceptance/payment_keys`,
        paymentData
      );

      logger.info('PayMob payment key created successfully');
      return response.data.token;
    } catch (error: any) {
      logger.error('PayMob payment key creation failed:', error.response?.data || error.message);
      throw new Error('PayMob payment key creation failed');
    }
  }

  /**
   * Verify PayMob callback signature
   */
  verifyCallback(data: PayMobCallbackData): boolean {
    try {
      const {
        amount_cents,
        created_at,
        currency,
        error_occured,
        has_parent_transaction,
        id,
        integration_id,
        is_3d_secure,
        is_auth,
        is_capture,
        is_refunded,
        is_standalone_payment,
        is_voided,
        order,
        owner,
        pending,
        source_data,
        success,
      } = data;

      // Create the string to be hashed
      const stringToHash = [
        amount_cents,
        created_at,
        currency,
        error_occured,
        has_parent_transaction,
        id,
        integration_id,
        is_3d_secure,
        is_auth,
        is_capture,
        is_refunded,
        is_standalone_payment,
        is_voided,
        order.id,
        owner,
        pending,
        source_data.pan,
        source_data.type,
        source_data.sub_type,
        success,
      ].join('');

      // Generate HMAC
      const hash = crypto
        .createHmac('sha512', this.hmacSecret)
        .update(stringToHash)
        .digest('hex');

      return hash === data.hmac;
    } catch (error) {
      logger.error('PayMob callback verification failed:', error);
      return false;
    }
  }

  /**
   * Process PayMob callback
   */
  async processCallback(callbackData: PayMobCallbackData): Promise<{
    success: boolean;
    transactionId: string;
    orderId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    customerData: {
      email: string;
      phone: string;
      name: string;
    };
  }> {
    try {
      // Verify callback signature
      if (!this.verifyCallback(callbackData)) {
        throw new Error('Invalid PayMob callback signature');
      }

      const result = {
        success: callbackData.success && !callbackData.error_occured,
        transactionId: callbackData.id.toString(),
        orderId: callbackData.order.merchant_order_id,
        amount: callbackData.amount_cents / 100, // Convert from cents
        currency: callbackData.currency,
        paymentMethod: 'paymob_card',
        customerData: {
          email: callbackData.order.shipping_data?.email || '',
          phone: callbackData.order.shipping_data?.phone_number || '',
          name: `${callbackData.order.shipping_data?.first_name || ''} ${callbackData.order.shipping_data?.last_name || ''}`.trim(),
        },
      };

      logger.info(`PayMob callback processed: ${result.success ? 'SUCCESS' : 'FAILED'}`, {
        transactionId: result.transactionId,
        orderId: result.orderId,
        amount: result.amount,
      });

      return result;
    } catch (error: any) {
      logger.error('PayMob callback processing failed:', error.message);
      throw error;
    }
  }

  /**
   * Initiate refund
   */
  async initiateRefund(
    authToken: string,
    transactionId: string,
    amount: number,
    reason: string
  ): Promise<{
    success: boolean;
    refundId: string;
  }> {
    try {
      const refundData = {
        auth_token: authToken,
        transaction_id: transactionId,
        amount_cents: amount * 100,
        reason,
      };

      const response = await axios.post(`${this.baseURL}/acceptance/void_refund/refund`, refundData);

      logger.info(`PayMob refund initiated: ${response.data.id}`);

      return {
        success: true,
        refundId: response.data.id,
      };
    } catch (error: any) {
      logger.error('PayMob refund initiation failed:', error.response?.data || error.message);
      throw new Error('PayMob refund initiation failed');
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(authToken: string, transactionId: string): Promise<{
    id: string;
    success: boolean;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseURL}/acceptance/transactions/${transactionId}`,
        {
          params: { auth_token: authToken },
        }
      );

      return {
        id: response.data.id.toString(),
        success: response.data.success,
        amount: response.data.amount_cents / 100,
        currency: response.data.currency,
        status: response.data.success ? 'completed' : 'failed',
        createdAt: response.data.created_at,
      };
    } catch (error: any) {
      logger.error('PayMob transaction status fetch failed:', error.response?.data || error.message);
      throw new Error('PayMob transaction status fetch failed');
    }
  }

  /**
   * Generate iframe URL for payment
   */
  generateIframeUrl(paymentKey: string): string {
    return `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentKey}`;
  }

  /**
   * Generate payment URL for redirect
   */
  generatePaymentUrl(paymentKey: string): string {
    return `https://accept.paymob.com/api/acceptance/payments/pay?payment_token=${paymentKey}`;
  }
}

export const paymobService = new PayMobService();
