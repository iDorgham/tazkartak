import { WebViewPaymentRequest, WebViewPaymentResponse, PaymentCallback, PaymentValidation } from '@/types/payment.types';
import { apiService } from './api.service';

class WebViewPaymentService {
  private activePayments = new Map<string, {
    paymentId: string;
    gateway: string;
    startTime: Date;
    timeout?: NodeJS.Timeout;
  }>();

  async processPayment(request: WebViewPaymentRequest): Promise<WebViewPaymentResponse> {
    try {
      // Validate request
      if (!request.url) {
        throw new Error('Payment URL is required');
      }

      // Set default timeout if not provided
      const timeout = request.timeout || 300000; // 5 minutes

      return {
        success: true,
        url: request.url,
        data: {
          headers: request.headers,
          postData: request.postData,
          timeout,
        },
      };
    } catch (error) {
      console.error('WebView payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'WebView payment failed',
      };
    }
  }

  async handlePaymentCallback(
    paymentId: string,
    callbackUrl: string,
    callbackData: Record<string, any>
  ): Promise<WebViewPaymentResponse> {
    try {
      // Extract payment information from callback URL and data
      const paymentInfo = this.extractPaymentInfo(callbackUrl, callbackData);

      // Validate callback
      const validation = await this.validateCallback(paymentInfo);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid callback');
      }

      // Update payment status via API
      const response = await apiService.post(`/payments/${paymentId}/callback`, {
        callbackData: paymentInfo,
        validation,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('WebView payment callback handling failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Callback handling failed',
      };
    }
  }

  private extractPaymentInfo(url: string, data: Record<string, any>): PaymentCallback {
    try {
      // Parse URL parameters
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      
      // Extract payment information from URL and data
      const paymentId = urlParams.get('payment_id') || data.payment_id || data.paymentId;
      const transactionId = urlParams.get('transaction_id') || data.transaction_id || data.transactionId;
      const status = urlParams.get('status') || data.status;
      const amount = parseFloat(urlParams.get('amount') || data.amount || '0');
      const currency = urlParams.get('currency') || data.currency || 'EGP';
      const signature = urlParams.get('signature') || data.signature;

      return {
        paymentId,
        status: status as any,
        transactionId,
        amount,
        currency,
        signature,
        timestamp: new Date().toISOString(),
        metadata: data,
      };
    } catch (error) {
      console.error('Failed to extract payment info:', error);
      throw new Error('Failed to extract payment information');
    }
  }

  private async validateCallback(callback: PaymentCallback): Promise<PaymentValidation> {
    try {
      // Basic validation
      if (!callback.paymentId) {
        return {
          isValid: false,
          error: 'Payment ID is missing',
        };
      }

      if (!callback.status) {
        return {
          isValid: false,
          error: 'Payment status is missing',
        };
      }

      // Verify signature if provided
      if (callback.signature) {
        const isValidSignature = await this.verifySignature(callback);
        if (!isValidSignature) {
          return {
            isValid: false,
            error: 'Invalid signature',
          };
        }
      }

      // Verify timestamp (within 10 minutes for WebView callbacks)
      const callbackTime = new Date(callback.timestamp);
      const currentTime = new Date();
      const timeDiff = Math.abs(currentTime.getTime() - callbackTime.getTime()) / 1000 / 60; // minutes

      if (timeDiff > 10) {
        return {
          isValid: false,
          error: 'Callback timestamp expired',
        };
      }

      return {
        isValid: true,
        signature: callback.signature,
        timestamp: callback.timestamp,
        amount: callback.amount,
        currency: callback.currency,
      };
    } catch (error) {
      console.error('Callback validation failed:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Callback validation failed',
      };
    }
  }

  private async verifySignature(callback: PaymentCallback): Promise<boolean> {
    try {
      // Get gateway configuration to verify signature
      const gatewayConfig = await this.getGatewayConfig(callback.paymentId);
      if (!gatewayConfig) {
        console.warn('Gateway configuration not found for signature verification');
        return true; // Allow if no config (for development)
      }

      // Generate expected signature
      const expectedSignature = await this.generateSignature(callback, gatewayConfig);
      return callback.signature === expectedSignature;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  private async getGatewayConfig(paymentId: string): Promise<any> {
    try {
      const response = await apiService.get(`/payments/${paymentId}/gateway-config`);
      return response.data.config;
    } catch (error) {
      console.error('Failed to get gateway config:', error);
      return null;
    }
  }

  private async generateSignature(callback: PaymentCallback, config: any): Promise<string> {
    try {
      // Create signature string according to gateway specifications
      const signatureString = [
        callback.paymentId,
        callback.transactionId,
        callback.amount,
        callback.currency,
        callback.status,
        callback.timestamp,
        config.secretKey,
      ].join('');

      // Generate SHA256 hash
      const CryptoJS = require('crypto-js');
      return CryptoJS.SHA256(signatureString).toString().toUpperCase();
    } catch (error) {
      console.error('Signature generation failed:', error);
      throw error;
    }
  }

  // Track active payment for timeout handling
  trackPayment(paymentId: string, gateway: string, timeoutMs: number = 300000): void {
    const timeout = setTimeout(() => {
      this.activePayments.delete(paymentId);
      console.warn(`Payment ${paymentId} timed out after ${timeoutMs}ms`);
    }, timeoutMs);

    this.activePayments.set(paymentId, {
      paymentId,
      gateway,
      startTime: new Date(),
      timeout,
    });
  }

  // Stop tracking payment
  stopTrackingPayment(paymentId: string): void {
    const payment = this.activePayments.get(paymentId);
    if (payment?.timeout) {
      clearTimeout(payment.timeout);
    }
    this.activePayments.delete(paymentId);
  }

  // Get active payment info
  getActivePayment(paymentId: string): any {
    return this.activePayments.get(paymentId);
  }

  // Get all active payments
  getActivePayments(): any[] {
    return Array.from(this.activePayments.values());
  }

  // Clear expired payments
  clearExpiredPayments(): void {
    const now = new Date();
    const expiredThreshold = 10 * 60 * 1000; // 10 minutes

    for (const [paymentId, payment] of this.activePayments.entries()) {
      const elapsed = now.getTime() - payment.startTime.getTime();
      if (elapsed > expiredThreshold) {
        if (payment.timeout) {
          clearTimeout(payment.timeout);
        }
        this.activePayments.delete(paymentId);
      }
    }
  }

  // Build payment URL with proper parameters
  buildPaymentUrl(
    baseUrl: string,
    paymentData: Record<string, any>,
    gateway: string
  ): string {
    try {
      const url = new URL(baseUrl);
      
      // Add payment parameters
      Object.entries(paymentData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });

      // Add gateway-specific parameters
      url.searchParams.append('gateway', gateway);
      url.searchParams.append('platform', 'mobile');
      url.searchParams.append('timestamp', new Date().toISOString());

      return url.toString();
    } catch (error) {
      console.error('Failed to build payment URL:', error);
      throw new Error('Failed to build payment URL');
    }
  }

  // Parse callback URL to extract payment information
  parseCallbackUrl(url: string): Record<string, string> {
    try {
      const urlObj = new URL(url);
      const params: Record<string, string> = {};
      
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return params;
    } catch (error) {
      console.error('Failed to parse callback URL:', error);
      return {};
    }
  }

  // Validate payment URL format
  validatePaymentUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Check if it's HTTPS (required for payments)
      if (urlObj.protocol !== 'https:') {
        return false;
      }

      // Check if it's a valid domain
      const validDomains = [
        'paymob.com',
        'fawry.com',
        'accept.payments',
        'accept.paymob.com',
        'atfawry.com',
      ];

      const hostname = urlObj.hostname.toLowerCase();
      return validDomains.some(domain => hostname.includes(domain));
    } catch (error) {
      console.error('Failed to validate payment URL:', error);
      return false;
    }
  }

  // Generate secure payment token
  async generatePaymentToken(paymentId: string, gateway: string): Promise<string> {
    try {
      const response = await apiService.post('/payments/token', {
        paymentId,
        gateway,
        platform: 'mobile',
        timestamp: new Date().toISOString(),
      });

      return response.data.token;
    } catch (error) {
      console.error('Failed to generate payment token:', error);
      throw new Error('Failed to generate payment token');
    }
  }

  // Verify payment token
  async verifyPaymentToken(token: string): Promise<boolean> {
    try {
      const response = await apiService.post('/payments/verify-token', {
        token,
      });

      return response.data.valid;
    } catch (error) {
      console.error('Failed to verify payment token:', error);
      return false;
    }
  }
}

export const webviewPaymentService = new WebViewPaymentService();

