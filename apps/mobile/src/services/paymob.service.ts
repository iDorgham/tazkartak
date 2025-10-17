import { Platform } from 'react-native';
import PayMob from 'react-native-paymob';
import { 
  PayMobConfig, 
  PayMobPaymentRequest, 
  PayMobPaymentKeyRequest,
  PayMobResponse,
  CreatePaymentInput,
  PaymentResponse,
  PaymentCallback,
  PaymentValidation
} from '@/types/payment.types';
import { apiService } from './api.service';
import { storageService } from './storage.service';

class PayMobService {
  private config: PayMobConfig | null = null;
  private isInitialized = false;

  async initialize(config: PayMobConfig): Promise<void> {
    try {
      this.config = config;
      
      // Initialize PayMob SDK
      await PayMob.initialize({
        apiKey: config.apiKey,
        sandboxMode: config.sandboxMode,
      });

      // Store configuration securely
      await storageService.setSecureItem('paymob_config', JSON.stringify(config));
      
      this.isInitialized = true;
      console.log('PayMob service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PayMob service:', error);
      throw new Error('PayMob initialization failed');
    }
  }

  async getStoredConfig(): Promise<PayMobConfig | null> {
    try {
      const configStr = await storageService.getSecureItem('paymob_config');
      return configStr ? JSON.parse(configStr) : null;
    } catch (error) {
      console.error('Failed to get stored PayMob config:', error);
      return null;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.config) {
      const storedConfig = await this.getStoredConfig();
      if (storedConfig) {
        await this.initialize(storedConfig);
      } else {
        throw new Error('PayMob service not initialized');
      }
    }
  }

  async createPaymentIntent(paymentInput: CreatePaymentInput): Promise<PaymentResponse> {
    try {
      await this.ensureInitialized();
      
      if (!this.config) {
        throw new Error('PayMob configuration not found');
      }

      // Step 1: Authentication
      const authToken = await this.authenticate();
      
      // Step 2: Create order
      const orderData = this.buildOrderRequest(paymentInput, authToken);
      const orderResponse = await apiService.post('/paymob/orders', orderData);
      
      // Step 3: Get payment key
      const paymentKeyRequest = this.buildPaymentKeyRequest(
        paymentInput, 
        orderResponse.data.id, 
        authToken
      );
      const paymentKeyResponse = await apiService.post('/paymob/payment-keys', paymentKeyRequest);
      
      return {
        success: true,
        paymentToken: paymentKeyResponse.data.token,
        redirectUrl: paymentKeyResponse.data.iframe_url,
        payment: {
          id: paymentInput.orderId,
          orderId: paymentInput.orderId,
          userId: paymentInput.customerInfo.email, // Assuming email as user identifier
          amount: paymentInput.amount,
          currency: paymentInput.currency,
          status: 'pending' as any,
          paymentMethod: paymentInput.paymentMethod,
          gateway: 'paymob' as any,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('PayMob payment creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed',
      };
    }
  }

  async processPayment(
    paymentToken: string, 
    paymentMethod: string,
    cardDetails?: {
      cardNumber: string;
      expiryMonth: string;
      expiryYear: string;
      cvv: string;
      holderName: string;
    }
  ): Promise<PaymentResponse> {
    try {
      await this.ensureInitialized();

      if (!this.config) {
        throw new Error('PayMob configuration not found');
      }

      let paymentResult;

      switch (paymentMethod) {
        case 'card':
          if (!cardDetails) {
            throw new Error('Card details required for card payment');
          }
          paymentResult = await this.processCardPayment(paymentToken, cardDetails);
          break;
        
        case 'wallet':
          paymentResult = await this.processWalletPayment(paymentToken);
          break;
        
        case 'kiosk':
          paymentResult = await this.processKioskPayment(paymentToken);
          break;
        
        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }

      return paymentResult;
    } catch (error) {
      console.error('PayMob payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  private async authenticate(): Promise<string> {
    try {
      const response = await apiService.post('/paymob/auth', {
        api_key: this.config!.apiKey,
      });
      return response.data.token;
    } catch (error) {
      console.error('PayMob authentication failed:', error);
      throw new Error('Authentication failed');
    }
  }

  private buildOrderRequest(paymentInput: CreatePaymentInput, authToken: string): PayMobPaymentRequest {
    return {
      auth_token: authToken,
      amount_cents: Math.round(paymentInput.amount * 100), // Convert to cents
      currency: paymentInput.currency,
      delivery_needed: false,
      items: paymentInput.items.map(item => ({
        name: item.name,
        amount_cents: Math.round(item.total * 100),
        description: item.description || '',
        quantity: item.quantity,
      })),
      integration_id: this.config!.integrationId,
      order_id: paymentInput.orderId,
      customer: {
        first_name: paymentInput.customerInfo.firstName,
        last_name: paymentInput.customerInfo.lastName,
        email: paymentInput.customerInfo.email,
        phone_number: paymentInput.customerInfo.phone,
      },
      merchant_order_id: paymentInput.orderId,
      metadata: paymentInput.metadata || {},
    };
  }

  private buildPaymentKeyRequest(
    paymentInput: CreatePaymentInput, 
    orderId: string, 
    authToken: string
  ): PayMobPaymentKeyRequest {
    return {
      auth_token: authToken,
      amount_cents: Math.round(paymentInput.amount * 100),
      expiration: 3600, // 1 hour
      order_id: orderId,
      billing_data: {
        apartment: paymentInput.customerInfo.address?.street || '',
        email: paymentInput.customerInfo.email,
        floor: '',
        first_name: paymentInput.customerInfo.firstName,
        street: paymentInput.customerInfo.address?.street || '',
        building: '',
        phone_number: paymentInput.customerInfo.phone,
        shipping_method: 'PKG',
        postal_code: paymentInput.customerInfo.address?.postalCode || '',
        city: paymentInput.customerInfo.address?.city || '',
        country: paymentInput.customerInfo.address?.country || 'EG',
        last_name: paymentInput.customerInfo.lastName,
        state: paymentInput.customerInfo.address?.state || '',
      },
      currency: paymentInput.currency,
      integration_id: this.config!.integrationId,
      lock_order_when_paid: true,
    };
  }

  private async processCardPayment(paymentToken: string, cardDetails: any): Promise<PaymentResponse> {
    try {
      const response = await PayMob.processCardPayment({
        paymentToken,
        cardNumber: cardDetails.cardNumber,
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear,
        cvv: cardDetails.cvv,
        holderName: cardDetails.holderName,
        integrationId: this.config!.cardIntegrationId,
      });

      if (response.success) {
        return {
          success: true,
          payment: {
            id: response.transactionId,
            orderId: response.orderId,
            userId: '',
            amount: response.amount / 100, // Convert from cents
            currency: response.currency,
            status: 'completed' as any,
            paymentMethod: 'credit_card' as any,
            gateway: 'paymob' as any,
            transactionId: response.transactionId,
            gatewayTransactionId: response.gatewayTransactionId,
            gatewayResponse: response.rawResponse,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Card payment failed',
        };
      }
    } catch (error) {
      console.error('PayMob card payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Card payment failed',
      };
    }
  }

  private async processWalletPayment(paymentToken: string): Promise<PaymentResponse> {
    try {
      const response = await PayMob.processWalletPayment({
        paymentToken,
        integrationId: this.config!.walletIntegrationId,
      });

      if (response.success) {
        return {
          success: true,
          payment: {
            id: response.transactionId,
            orderId: response.orderId,
            userId: '',
            amount: response.amount / 100,
            currency: response.currency,
            status: 'completed' as any,
            paymentMethod: 'wallet' as any,
            gateway: 'paymob' as any,
            transactionId: response.transactionId,
            gatewayTransactionId: response.gatewayTransactionId,
            gatewayResponse: response.rawResponse,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Wallet payment failed',
        };
      }
    } catch (error) {
      console.error('PayMob wallet payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Wallet payment failed',
      };
    }
  }

  private async processKioskPayment(paymentToken: string): Promise<PaymentResponse> {
    try {
      const response = await PayMob.processKioskPayment({
        paymentToken,
        integrationId: this.config!.kioskIntegrationId,
      });

      if (response.success) {
        return {
          success: true,
          redirectUrl: response.referenceNumber, // Kiosk reference number
          payment: {
            id: response.transactionId,
            orderId: response.orderId,
            userId: '',
            amount: response.amount / 100,
            currency: response.currency,
            status: 'pending' as any, // Kiosk payments are pending until paid
            paymentMethod: 'cash_on_delivery' as any,
            gateway: 'paymob' as any,
            transactionId: response.transactionId,
            gatewayTransactionId: response.gatewayTransactionId,
            gatewayResponse: response.rawResponse,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Kiosk payment failed',
        };
      }
    } catch (error) {
      console.error('PayMob kiosk payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Kiosk payment failed',
      };
    }
  }

  async verifyPaymentCallback(callback: PaymentCallback): Promise<PaymentValidation> {
    try {
      await this.ensureInitialized();

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

      // Verify timestamp (within 5 minutes)
      const callbackTime = new Date(callback.timestamp);
      const currentTime = new Date();
      const timeDiff = Math.abs(currentTime.getTime() - callbackTime.getTime()) / 1000 / 60; // minutes

      if (timeDiff > 5) {
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
      console.error('PayMob callback verification failed:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Callback verification failed',
      };
    }
  }

  private async verifySignature(callback: PaymentCallback): Promise<boolean> {
    try {
      // Implement signature verification logic
      // This would typically involve HMAC-SHA256 verification
      const expectedSignature = await this.generateSignature(callback);
      return callback.signature === expectedSignature;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  private async generateSignature(callback: PaymentCallback): Promise<string> {
    try {
      // Generate HMAC-SHA256 signature
      const payload = `${callback.paymentId}${callback.transactionId}${callback.amount}${callback.currency}${callback.timestamp}`;
      // Use crypto-js or react-native-crypto to generate HMAC
      // This is a simplified implementation
      return btoa(payload); // In real implementation, use proper HMAC
    } catch (error) {
      console.error('Signature generation failed:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      await this.ensureInitialized();
      
      const response = await apiService.get(`/paymob/payments/${paymentId}/status`);
      
      return {
        success: true,
        payment: response.data.payment,
      };
    } catch (error) {
      console.error('PayMob payment status check failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment status check failed',
      };
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
    try {
      await this.ensureInitialized();
      
      const response = await apiService.post(`/paymob/payments/${paymentId}/refund`, {
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
      });
      
      return {
        success: true,
        payment: response.data.payment,
      };
    } catch (error) {
      console.error('PayMob refund failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund failed',
      };
    }
  }

  isSupported(): boolean {
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }

  getSupportedPaymentMethods(): string[] {
    return ['card', 'wallet', 'kiosk'];
  }
}

export const paymobService = new PayMobService();

