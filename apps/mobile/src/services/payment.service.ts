import { Platform } from 'react-native';
import { 
  Payment, 
  CreatePaymentInput, 
  PaymentResponse, 
  PaymentGateway, 
  PaymentMethod,
  PaymentCallback,
  PaymentValidation,
  PaymentSession,
  PaymentSessionRequest,
  WebViewPaymentRequest
} from '@/types/payment.types';
import { paymobService } from './paymob.service';
import { fawryService } from './fawry.service';
import { webviewPaymentService } from './webview-payment.service';
import { apiService } from './api.service';
import { storageService } from './storage.service';
import { netInfo } from './network.service';

class PaymentService {
  private paymentSessions = new Map<string, PaymentSession>();

  async initialize(): Promise<void> {
    try {
      // Initialize all payment gateways
      await this.initializeGateways();
      
      console.log('Payment service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize payment service:', error);
      throw new Error('Payment service initialization failed');
    }
  }

  private async initializeGateways(): Promise<void> {
    try {
      // Initialize PayMob
      const paymobConfig = await storageService.getSecureItem('paymob_config');
      if (paymobConfig) {
        await paymobService.initialize(JSON.parse(paymobConfig));
      }

      // Initialize Fawry
      const fawryConfig = await storageService.getSecureItem('fawry_config');
      if (fawryConfig) {
        await fawryService.initialize(JSON.parse(fawryConfig));
      }
    } catch (error) {
      console.error('Failed to initialize payment gateways:', error);
      // Don't throw here, allow service to work with available gateways
    }
  }

  async createPayment(paymentInput: CreatePaymentInput): Promise<PaymentResponse> {
    try {
      // Validate payment input
      this.validatePaymentInput(paymentInput);

      // Check network connectivity
      const isConnected = await netInfo.isConnected();
      if (!isConnected) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      // Create payment session
      const session = await this.createPaymentSession(paymentInput);
      
      // Process payment based on gateway
      let paymentResult: PaymentResponse;

      switch (paymentInput.gateway) {
        case PaymentGateway.PAYMOB:
          paymentResult = await paymobService.createPaymentIntent(paymentInput);
          break;
        
        case PaymentGateway.FAWRY:
          paymentResult = await fawryService.createPaymentIntent(paymentInput);
          break;
        
        default:
          throw new Error(`Unsupported payment gateway: ${paymentInput.gateway}`);
      }

      if (paymentResult.success && paymentResult.payment) {
        // Store payment session
        this.paymentSessions.set(session.id, {
          ...session,
          status: 'active',
        });

        // Track payment for timeout
        webviewPaymentService.trackPayment(
          paymentResult.payment.id,
          paymentInput.gateway,
          300000 // 5 minutes
        );
      }

      return paymentResult;
    } catch (error) {
      console.error('Payment creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed',
      };
    }
  }

  async processPayment(
    paymentId: string,
    paymentMethod: string,
    paymentDetails?: any
  ): Promise<PaymentResponse> {
    try {
      // Get payment session
      const session = this.paymentSessions.get(paymentId);
      if (!session) {
        throw new Error('Payment session not found');
      }

      if (session.status !== 'active') {
        throw new Error('Payment session is not active');
      }

      // Check if session has expired
      if (new Date() > new Date(session.expiresAt)) {
        this.paymentSessions.set(paymentId, { ...session, status: 'expired' });
        throw new Error('Payment session has expired');
      }

      let paymentResult: PaymentResponse;

      // Process payment based on gateway
      switch (session.gateway) {
        case PaymentGateway.PAYMOB:
          paymentResult = await paymobService.processPayment(
            paymentId,
            paymentMethod,
            paymentDetails
          );
          break;
        
        case PaymentGateway.FAWRY:
          paymentResult = await fawryService.processPayment(
            paymentId,
            paymentMethod,
            paymentDetails
          );
          break;
        
        default:
          throw new Error(`Unsupported payment gateway: ${session.gateway}`);
      }

      if (paymentResult.success) {
        // Update session status
        this.paymentSessions.set(paymentId, {
          ...session,
          status: 'completed',
        });

        // Stop tracking payment
        webviewPaymentService.stopTrackingPayment(paymentId);
      }

      return paymentResult;
    } catch (error) {
      console.error('Payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  async processWebViewPayment(
    paymentId: string,
    webViewRequest: WebViewPaymentRequest
  ): Promise<PaymentResponse> {
    try {
      // Validate WebView request
      if (!webviewPaymentService.validatePaymentUrl(webViewRequest.url)) {
        throw new Error('Invalid payment URL');
      }

      // Process WebView payment
      const webViewResult = await webviewPaymentService.processPayment(webViewRequest);
      
      if (!webViewResult.success) {
        throw new Error(webViewResult.error || 'WebView payment failed');
      }

      return {
        success: true,
        redirectUrl: webViewRequest.url,
        payment: {
          id: paymentId,
          orderId: paymentId,
          userId: '',
          amount: 0, // Will be updated from callback
          currency: 'EGP',
          status: 'processing' as any,
          paymentMethod: 'webview' as any,
          gateway: 'webview' as any,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('WebView payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'WebView payment failed',
      };
    }
  }

  async handlePaymentCallback(callback: PaymentCallback): Promise<PaymentResponse> {
    try {
      // Validate callback
      const validation = await this.validatePaymentCallback(callback);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid payment callback');
      }

      // Determine gateway from callback
      const gateway = this.determineGatewayFromCallback(callback);
      
      let verificationResult: PaymentValidation;

      // Verify callback with appropriate gateway
      switch (gateway) {
        case PaymentGateway.PAYMOB:
          verificationResult = await paymobService.verifyPaymentCallback(callback);
          break;
        
        case PaymentGateway.FAWRY:
          verificationResult = await fawryService.verifyPaymentCallback(callback);
          break;
        
        default:
          // Use WebView verification for unknown gateways
          verificationResult = await webviewPaymentService.validateCallback(callback);
      }

      if (!verificationResult.isValid) {
        throw new Error(verificationResult.error || 'Payment callback verification failed');
      }

      // Update payment status via API
      const response = await apiService.post(`/payments/${callback.paymentId}/callback`, {
        callback,
        verification: verificationResult,
      });

      // Update payment session
      const session = this.paymentSessions.get(callback.paymentId);
      if (session) {
        this.paymentSessions.set(callback.paymentId, {
          ...session,
          status: callback.status === 'completed' ? 'completed' : 'failed',
        });

        // Stop tracking payment
        webviewPaymentService.stopTrackingPayment(callback.paymentId);
      }

      return {
        success: true,
        payment: response.data.payment,
      };
    } catch (error) {
      console.error('Payment callback handling failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment callback failed',
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await apiService.get(`/payments/${paymentId}`);
      
      return {
        success: true,
        payment: response.data.payment,
      };
    } catch (error) {
      console.error('Payment status check failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment status check failed',
      };
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
    try {
      // Get payment details to determine gateway
      const paymentResponse = await this.getPaymentStatus(paymentId);
      if (!paymentResponse.success || !paymentResponse.payment) {
        throw new Error('Payment not found');
      }

      const payment = paymentResponse.payment;
      let refundResult: PaymentResponse;

      // Process refund based on gateway
      switch (payment.gateway) {
        case PaymentGateway.PAYMOB:
          refundResult = await paymobService.refundPayment(paymentId, amount);
          break;
        
        case PaymentGateway.FAWRY:
          refundResult = await fawryService.refundPayment(paymentId, amount);
          break;
        
        default:
          // Handle refund via API for other gateways
          const response = await apiService.post(`/payments/${paymentId}/refund`, {
            amount,
          });
          refundResult = {
            success: true,
            payment: response.data.payment,
          };
      }

      return refundResult;
    } catch (error) {
      console.error('Payment refund failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment refund failed',
      };
    }
  }

  private validatePaymentInput(paymentInput: CreatePaymentInput): void {
    if (!paymentInput.orderId) {
      throw new Error('Order ID is required');
    }

    if (!paymentInput.amount || paymentInput.amount <= 0) {
      throw new Error('Valid amount is required');
    }

    if (!paymentInput.currency) {
      throw new Error('Currency is required');
    }

    if (!paymentInput.paymentMethod) {
      throw new Error('Payment method is required');
    }

    if (!paymentInput.gateway) {
      throw new Error('Payment gateway is required');
    }

    if (!paymentInput.customerInfo) {
      throw new Error('Customer information is required');
    }

    if (!paymentInput.customerInfo.email) {
      throw new Error('Customer email is required');
    }

    if (!paymentInput.items || paymentInput.items.length === 0) {
      throw new Error('At least one payment item is required');
    }
  }

  private async createPaymentSession(paymentInput: CreatePaymentInput): Promise<PaymentSession> {
    const sessionId = `session_${paymentInput.orderId}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const session: PaymentSession = {
      id: sessionId,
      paymentId: paymentInput.orderId,
      sessionToken: await this.generateSessionToken(sessionId),
      expiresAt: expiresAt.toISOString(),
      status: 'active',
      gateway: paymentInput.gateway,
      paymentMethod: paymentInput.paymentMethod,
    };

    return session;
  }

  private async generateSessionToken(sessionId: string): Promise<string> {
    try {
      const response = await apiService.post('/payments/session-token', {
        sessionId,
        timestamp: new Date().toISOString(),
      });

      return response.data.token;
    } catch (error) {
      console.error('Failed to generate session token:', error);
      // Return a fallback token
      return `token_${sessionId}_${Date.now()}`;
    }
  }

  private async validatePaymentCallback(callback: PaymentCallback): Promise<PaymentValidation> {
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

      // Check if payment session exists
      const session = this.paymentSessions.get(callback.paymentId);
      if (!session) {
        return {
          isValid: false,
          error: 'Payment session not found',
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
      console.error('Payment callback validation failed:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Callback validation failed',
      };
    }
  }

  private determineGatewayFromCallback(callback: PaymentCallback): PaymentGateway {
    // Try to determine gateway from callback metadata
    if (callback.metadata?.gateway) {
      return callback.metadata.gateway as PaymentGateway;
    }

    // Default to WebView for unknown callbacks
    return PaymentGateway.PAYMOB; // Default fallback
  }

  // Get available payment methods for a gateway
  getAvailablePaymentMethods(gateway: PaymentGateway): string[] {
    switch (gateway) {
      case PaymentGateway.PAYMOB:
        return paymobService.getSupportedPaymentMethods();
      
      case PaymentGateway.FAWRY:
        return fawryService.getSupportedPaymentMethods();
      
      default:
        return ['webview'];
    }
  }

  // Check if a gateway is supported on the current platform
  isGatewaySupported(gateway: PaymentGateway): boolean {
    switch (gateway) {
      case PaymentGateway.PAYMOB:
        return paymobService.isSupported();
      
      case PaymentGateway.FAWRY:
        return fawryService.isSupported();
      
      default:
        return true; // WebView is always supported
    }
  }

  // Get payment session
  getPaymentSession(paymentId: string): PaymentSession | undefined {
    return this.paymentSessions.get(paymentId);
  }

  // Clear expired payment sessions
  clearExpiredSessions(): void {
    const now = new Date();
    
    for (const [paymentId, session] of this.paymentSessions.entries()) {
      if (new Date(session.expiresAt) < now) {
        this.paymentSessions.delete(paymentId);
        webviewPaymentService.stopTrackingPayment(paymentId);
      }
    }
  }

  // Get all active payment sessions
  getActiveSessions(): PaymentSession[] {
    const now = new Date();
    return Array.from(this.paymentSessions.values()).filter(
      session => session.status === 'active' && new Date(session.expiresAt) > now
    );
  }
}

export const paymentService = new PaymentService();

