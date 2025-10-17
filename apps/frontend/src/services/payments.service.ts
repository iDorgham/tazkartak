import { api } from './api.service';

export interface PaymentMethod {
  code: string;
  name: string;
  description: string;
  gateway: string;
}

export interface PaymentInitiationData {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  amount: number;
  currency?: string;
  paymentMethod: string;
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  returnUrl?: string;
}

export interface PaymentInitiationResult {
  success: boolean;
  paymentId: string;
  paymentUrl?: string;
  iframeUrl?: string;
  qrCodeUrl?: string;
  referenceNumber?: string;
  orderId?: string;
  expiresAt: string;
}

export interface PaymentStatus {
  id: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentHistory {
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    createdAt: string;
    completedAt?: string;
    event: {
      id: string;
      name: string;
      startDate: string;
    };
    tickets: Array<{
      id: string;
      status: string;
      type: string;
    }>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentDetails {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
  refundedAmount?: number;
  refundedAt?: string;
  gatewayTransactionId?: string;
  metadata?: any;
  event: {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    venue: {
      name: string;
      location: string;
    };
  };
  tickets: Array<{
    id: string;
    status: string;
    type: string;
    price: number;
    seatNumber?: string;
    purchaseDate: string;
  }>;
  buyer: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RefundRequest {
  amount: number;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
}

class PaymentsService {
  /**
   * Get available payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await api.get('/payments/methods');
    return response.data.data;
  }

  /**
   * Initiate payment
   */
  async initiatePayment(data: PaymentInitiationData): Promise<PaymentInitiationResult> {
    const response = await api.post('/payments/initiate', data);
    return response.data.data;
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const response = await api.get(`/payments/status/${paymentId}`);
    return response.data.data;
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string): Promise<PaymentDetails> {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data.data;
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaymentHistory> {
    const response = await api.get('/payments/history', { params });
    return response.data.data;
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, refundData: RefundRequest): Promise<RefundResult> {
    const response = await api.post(`/payments/refund/${paymentId}`, refundData);
    return response.data.data;
  }

  /**
   * Check if payment method requires redirect
   */
  requiresRedirect(paymentMethod: string): boolean {
    const redirectMethods = [
      'paymob_card',
      'fawry_card',
      'fawry_wallet',
      'fawry_valu',
      'fawry_plus',
      'fawry_atm',
      'fawry_mwallet',
    ];

    return redirectMethods.includes(paymentMethod);
  }

  /**
   * Check if payment method supports iframe
   */
  supportsIframe(paymentMethod: string): boolean {
    const iframeMethods = ['paymob_card'];
    return iframeMethods.includes(paymentMethod);
  }

  /**
   * Check if payment method generates QR code
   */
  generatesQRCode(paymentMethod: string): boolean {
    const qrMethods = ['fawry_payat'];
    return qrMethods.includes(paymentMethod);
  }

  /**
   * Format payment method for display
   */
  formatPaymentMethod(paymentMethod: string): string {
    const methodMap: Record<string, string> = {
      'paymob_card': 'Credit/Debit Card',
      'fawry_card': 'Credit/Debit Card (Fawry)',
      'fawry_wallet': 'Fawry Wallet',
      'fawry_valu': 'Valu Installment',
      'fawry_plus': 'Fawry Plus',
      'fawry_atm': 'ATM',
      'fawry_mwallet': 'Mobile Wallet',
      'fawry_payat': 'Pay at Fawry',
    };

    return methodMap[paymentMethod] || paymentMethod;
  }

  /**
   * Get payment method icon
   */
  getPaymentMethodIcon(paymentMethod: string): string {
    const iconMap: Record<string, string> = {
      'paymob_card': '💳',
      'fawry_card': '💳',
      'fawry_wallet': '👛',
      'fawry_valu': '📱',
      'fawry_plus': '➕',
      'fawry_atm': '🏧',
      'fawry_mwallet': '📱',
      'fawry_payat': '🏪',
    };

    return iconMap[paymentMethod] || '💳';
  }

  /**
   * Format payment status
   */
  formatPaymentStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pending',
      'COMPLETED': 'Completed',
      'FAILED': 'Failed',
      'CANCELLED': 'Cancelled',
      'REFUNDED': 'Refunded',
      'PARTIALLY_REFUNDED': 'Partially Refunded',
    };

    return statusMap[status] || status;
  }

  /**
   * Get payment status color
   */
  getPaymentStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'PENDING': 'warning',
      'COMPLETED': 'success',
      'FAILED': 'error',
      'CANCELLED': 'default',
      'REFUNDED': 'info',
      'PARTIALLY_REFUNDED': 'warning',
    };

    return colorMap[status] || 'default';
  }

  /**
   * Validate payment form data
   */
  validatePaymentData(data: PaymentInitiationData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.eventId) {
      errors.push('Event ID is required');
    }

    if (!data.ticketTypeId) {
      errors.push('Ticket type is required');
    }

    if (!data.quantity || data.quantity < 1) {
      errors.push('Quantity must be at least 1');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!data.paymentMethod) {
      errors.push('Payment method is required');
    }

    if (!data.customerData.firstName) {
      errors.push('First name is required');
    }

    if (!data.customerData.lastName) {
      errors.push('Last name is required');
    }

    if (!data.customerData.email) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(data.customerData.email)) {
      errors.push('Email format is invalid');
    }

    if (!data.customerData.phone) {
      errors.push('Phone number is required');
    } else if (!/^[+]?[\d\s-()]+$/.test(data.customerData.phone)) {
      errors.push('Phone number format is invalid');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate fees for payment method
   */
  calculateFees(amount: number, paymentMethod: string): {
    fee: number;
    total: number;
    feePercentage: number;
  } {
    const feeRates: Record<string, number> = {
      'paymob_card': 0.029, // 2.9%
      'fawry_card': 0.025, // 2.5%
      'fawry_wallet': 0.015, // 1.5%
      'fawry_valu': 0.02, // 2%
      'fawry_plus': 0.02, // 2%
      'fawry_atm': 0.01, // 1%
      'fawry_mwallet': 0.015, // 1.5%
      'fawry_payat': 0.005, // 0.5%
    };

    const feePercentage = feeRates[paymentMethod] || 0;
    const fee = amount * feePercentage;
    const total = amount + fee;

    return {
      fee: Math.round(fee * 100) / 100,
      total: Math.round(total * 100) / 100,
      feePercentage: feePercentage * 100,
    };
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'EGP'): string {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Get payment instructions for specific method
   */
  getPaymentInstructions(paymentMethod: string): string[] {
    const instructions: Record<string, string[]> = {
      'paymob_card': [
        'You will be redirected to a secure payment page',
        'Enter your card details (number, expiry, CVV)',
        'Complete the payment process',
        'You will be redirected back to our site',
      ],
      'fawry_card': [
        'You will be redirected to Fawry payment page',
        'Enter your card details',
        'Complete the payment process',
        'You will be redirected back to our site',
      ],
      'fawry_wallet': [
        'You will be redirected to Fawry wallet login',
        'Enter your wallet credentials',
        'Confirm the payment amount',
        'Complete the transaction',
      ],
      'fawry_valu': [
        'You will be redirected to Valu service',
        'Enter your Valu credentials',
        'Select your installment plan',
        'Complete the payment setup',
      ],
      'fawry_payat': [
        'You will receive a reference number',
        'Visit any Fawry outlet with the reference',
        'Pay the amount in cash',
        'Keep the receipt as proof of payment',
      ],
    };

    return instructions[paymentMethod] || [
      'Follow the instructions on the payment page',
      'Complete the payment process',
      'You will be redirected back to our site',
    ];
  }
}

export const paymentsService = new PaymentsService();