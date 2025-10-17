import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger.util';
import { appConfig } from '../config/app.config';

export interface FawryChargeRequest {
  merchantCode: string;
  merchantRefNum: string;
  customerProfileId: string;
  customerMobile: string;
  customerEmail: string;
  paymentMethod: string;
  amount: string;
  currencyCode: string;
  description: string;
  chargeItems: Array<{
    itemId: string;
    description: string;
    price: string;
    quantity: number;
  }>;
  returnUrl?: string;
  authCode?: string;
}

export interface FawryChargeResponse {
  type: string;
  referenceNumber: string;
  merchantRefNumber: string;
  expirationTime: string;
  statusCode: string;
  statusDescription: string;
  paymentUrl?: string;
  paymentGatewayReferenceNumber?: string;
  signature?: string;
}

export interface FawryCallbackData {
  merchantRefNumber: string;
  fawryRefNumber: string;
  paymentRefNumber: string;
  orderStatus: string;
  paymentMethod: string;
  paymentAmount: string;
  orderAmount: string;
  fawryFees: string;
  shippingFees: string;
  serviceFees: string;
  tax: string;
  discount: string;
  paymentStatus: string;
  paymentTime: string;
  signature: string;
}

export interface FawryPaymentStatusResponse {
  type: string;
  referenceNumber: string;
  merchantRefNumber: string;
  paymentAmount: string;
  orderAmount: string;
  fawryFees: string;
  shippingFees: string;
  serviceFees: string;
  tax: string;
  discount: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentTime: string;
  expirationTime: string;
  statusCode: string;
  statusDescription: string;
}

class FawryService {
  private readonly baseURL: string;
  private readonly merchantCode: string;
  private readonly merchantSecureKey: string;
  private readonly isTestMode: boolean;

  constructor() {
    this.baseURL = appConfig.payment.fawry.baseURL;
    this.merchantCode = appConfig.payment.fawry.merchantCode;
    this.merchantSecureKey = appConfig.payment.fawry.merchantSecureKey;
    this.isTestMode = appConfig.payment.fawry.isTestMode;
  }

  /**
   * Generate signature for Fawry requests
   */
  private generateSignature(data: Record<string, any>): string {
    // Sort keys and create query string
    const sortedKeys = Object.keys(data).sort();
    const queryString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');

    // Add merchant secure key
    const stringToSign = queryString + this.merchantSecureKey;

    // Generate SHA256 hash
    return crypto.createHash('sha256').update(stringToSign).digest('hex');
  }

  /**
   * Verify Fawry callback signature
   */
  verifyCallback(callbackData: FawryCallbackData): boolean {
    try {
      const {
        merchantRefNumber,
        fawryRefNumber,
        paymentRefNumber,
        orderStatus,
        paymentMethod,
        paymentAmount,
        orderAmount,
        fawryFees,
        shippingFees,
        serviceFees,
        tax,
        discount,
        paymentStatus,
        paymentTime,
      } = callbackData;

      const dataToSign = {
        merchantRefNumber,
        fawryRefNumber,
        paymentRefNumber,
        orderStatus,
        paymentMethod,
        paymentAmount,
        orderAmount,
        fawryFees,
        shippingFees,
        serviceFees,
        tax,
        discount,
        paymentStatus,
        paymentTime,
      };

      const expectedSignature = this.generateSignature(dataToSign);
      return expectedSignature === callbackData.signature;
    } catch (error) {
      logger.error('Fawry callback verification failed:', error);
      return false;
    }
  }

  /**
   * Create a charge request
   */
  async createChargeRequest(chargeData: {
    merchantRefNum: string;
    customerProfileId: string;
    customerMobile: string;
    customerEmail: string;
    paymentMethod: string;
    amount: number;
    description: string;
    returnUrl?: string;
  }): Promise<FawryChargeResponse> {
    try {
      const chargeRequest: FawryChargeRequest = {
        merchantCode: this.merchantCode,
        merchantRefNum: chargeData.merchantRefNum,
        customerProfileId: chargeData.customerProfileId,
        customerMobile: chargeData.customerMobile,
        customerEmail: chargeData.customerEmail,
        paymentMethod: chargeData.paymentMethod,
        amount: chargeData.amount.toFixed(2),
        currencyCode: 'EGP',
        description: chargeData.description,
        chargeItems: [
          {
            itemId: '1',
            description: chargeData.description,
            price: chargeData.amount.toFixed(2),
            quantity: 1,
          },
        ],
        returnUrl: chargeData.returnUrl,
      };

      // Generate signature
      const signature = this.generateSignature(chargeRequest);
      chargeRequest.authCode = signature;

      const response = await axios.post<FawryChargeResponse>(
        `${this.baseURL}/ECommerceWeb/Fawry/payments/charge`,
        chargeRequest,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Fawry charge request created: ${response.data.referenceNumber}`);

      return response.data;
    } catch (error: any) {
      logger.error('Fawry charge request failed:', error.response?.data || error.message);
      throw new Error('Fawry charge request failed');
    }
  }

  /**
   * Process Fawry callback
   */
  async processCallback(callbackData: FawryCallbackData): Promise<{
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
    fawryRefNumber: string;
    paymentRefNumber: string;
  }> {
    try {
      // Verify callback signature
      if (!this.verifyCallback(callbackData)) {
        throw new Error('Invalid Fawry callback signature');
      }

      const isSuccess = callbackData.paymentStatus === 'PAID' && callbackData.orderStatus === 'NEW';

      const result = {
        success: isSuccess,
        transactionId: callbackData.paymentRefNumber,
        orderId: callbackData.merchantRefNumber,
        amount: parseFloat(callbackData.paymentAmount),
        currency: 'EGP',
        paymentMethod: this.mapFawryPaymentMethod(callbackData.paymentMethod),
        customerData: {
          email: '', // Fawry doesn't provide customer email in callback
          phone: '', // Fawry doesn't provide customer phone in callback
          name: '', // Fawry doesn't provide customer name in callback
        },
        fawryRefNumber: callbackData.fawryRefNumber,
        paymentRefNumber: callbackData.paymentRefNumber,
      };

      logger.info(`Fawry callback processed: ${result.success ? 'SUCCESS' : 'FAILED'}`, {
        transactionId: result.transactionId,
        orderId: result.orderId,
        amount: result.amount,
        fawryRefNumber: result.fawryRefNumber,
      });

      return result;
    } catch (error: any) {
      logger.error('Fawry callback processing failed:', error.message);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(merchantRefNumber: string): Promise<FawryPaymentStatusResponse> {
    try {
      const requestData = {
        merchantCode: this.merchantCode,
        merchantRefNumber,
      };

      // Generate signature
      const signature = this.generateSignature(requestData);

      const response = await axios.post<FawryPaymentStatusResponse>(
        `${this.baseURL}/ECommerceWeb/Fawry/payments/status`,
        {
          ...requestData,
          signature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Fawry payment status retrieved: ${merchantRefNumber}`);

      return response.data;
    } catch (error: any) {
      logger.error('Fawry payment status fetch failed:', error.response?.data || error.message);
      throw new Error('Fawry payment status fetch failed');
    }
  }

  /**
   * Create refund request
   */
  async createRefundRequest(
    merchantRefNumber: string,
    fawryRefNumber: string,
    refundAmount: number,
    reason: string
  ): Promise<{
    success: boolean;
    refundId: string;
  }> {
    try {
      const refundData = {
        merchantCode: this.merchantCode,
        merchantRefNumber,
        fawryRefNumber,
        refundAmount: refundAmount.toFixed(2),
        reason,
      };

      // Generate signature
      const signature = this.generateSignature(refundData);

      const response = await axios.post(
        `${this.baseURL}/ECommerceWeb/Fawry/payments/refund`,
        {
          ...refundData,
          signature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Fawry refund request created: ${merchantRefNumber}`);

      return {
        success: true,
        refundId: response.data.refundReferenceNumber || fawryRefNumber,
      };
    } catch (error: any) {
      logger.error('Fawry refund request failed:', error.response?.data || error.message);
      throw new Error('Fawry refund request failed');
    }
  }

  /**
   * Map Fawry payment method to internal format
   */
  private mapFawryPaymentMethod(fawryMethod: string): string {
    const methodMap: Record<string, string> = {
      'CARD': 'fawry_card',
      'WALLET': 'fawry_wallet',
      'VALU': 'fawry_valu',
      'FAWRY_PLUS': 'fawry_plus',
      'ATM': 'fawry_atm',
      'MWALLET': 'fawry_mwallet',
      'PAYATFAWRY': 'fawry_payat',
    };

    return methodMap[fawryMethod] || 'fawry_unknown';
  }

  /**
   * Generate payment URL for different payment methods
   */
  generatePaymentUrl(referenceNumber: string, paymentMethod: string = 'PAYATFAWRY'): string {
    const baseUrl = this.isTestMode 
      ? 'https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments'
      : 'https://www.atfawry.com/ECommerceWeb/Fawry/payments';

    const paymentUrls: Record<string, string> = {
      'CARD': `${baseUrl}/pay`,
      'WALLET': `${baseUrl}/pay`,
      'VALU': `${baseUrl}/pay`,
      'FAWRY_PLUS': `${baseUrl}/pay`,
      'ATM': `${baseUrl}/pay`,
      'MWALLET': `${baseUrl}/pay`,
      'PAYATFAWRY': `${baseUrl}/pay`,
    };

    const url = paymentUrls[paymentMethod] || paymentUrls['PAYATFAWRY'];
    return `${url}?referenceNumber=${referenceNumber}`;
  }

  /**
   * Generate QR code URL for Pay at Fawry
   */
  generateQRCodeUrl(referenceNumber: string): string {
    const baseUrl = this.isTestMode 
      ? 'https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments'
      : 'https://www.atfawry.com/ECommerceWeb/Fawry/payments';

    return `${baseUrl}/qr?referenceNumber=${referenceNumber}`;
  }

  /**
   * Validate payment method
   */
  isValidPaymentMethod(method: string): boolean {
    const validMethods = [
      'CARD',
      'WALLET',
      'VALU',
      'FAWRY_PLUS',
      'ATM',
      'MWALLET',
      'PAYATFAWRY',
    ];

    return validMethods.includes(method);
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods(): Array<{
    code: string;
    name: string;
    description: string;
  }> {
    return [
      {
        code: 'CARD',
        name: 'Credit/Debit Card',
        description: 'Pay with your credit or debit card',
      },
      {
        code: 'WALLET',
        name: 'Fawry Wallet',
        description: 'Pay using your Fawry wallet balance',
      },
      {
        code: 'VALU',
        name: 'Valu',
        description: 'Pay using Valu installment service',
      },
      {
        code: 'FAWRY_PLUS',
        name: 'Fawry Plus',
        description: 'Pay using Fawry Plus service',
      },
      {
        code: 'ATM',
        name: 'ATM',
        description: 'Pay using ATM card',
      },
      {
        code: 'MWALLET',
        name: 'Mobile Wallet',
        description: 'Pay using mobile wallet',
      },
      {
        code: 'PAYATFAWRY',
        name: 'Pay at Fawry',
        description: 'Pay cash at any Fawry outlet',
      },
    ];
  }
}

export const fawryService = new FawryService();
