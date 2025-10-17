import { Platform } from 'react-native';
import Fawry from 'react-native-fawry';
import { 
  FawryConfig, 
  FawryPaymentRequest, 
  FawryResponse,
  CreatePaymentInput,
  PaymentResponse,
  PaymentCallback,
  PaymentValidation
} from '@/types/payment.types';
import { apiService } from './api.service';
import { storageService } from './storage.service';

class FawryService {
  private config: FawryConfig | null = null;
  private isInitialized = false;

  async initialize(config: FawryConfig): Promise<void> {
    try {
      this.config = config;
      
      // Initialize Fawry SDK
      await Fawry.initialize({
        merchantCode: config.merchantCode,
        merchantSecretKey: config.merchantSecretKey,
        sandboxMode: config.sandboxMode,
      });

      // Store configuration securely
      await storageService.setSecureItem('fawry_config', JSON.stringify(config));
      
      this.isInitialized = true;
      console.log('Fawry service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Fawry service:', error);
      throw new Error('Fawry initialization failed');
    }
  }

  async getStoredConfig(): Promise<FawryConfig | null> {
    try {
      const configStr = await storageService.getSecureItem('fawry_config');
      return configStr ? JSON.parse(configStr) : null;
    } catch (error) {
      console.error('Failed to get stored Fawry config:', error);
      return null;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.config) {
      const storedConfig = await this.getStoredConfig();
      if (storedConfig) {
        await this.initialize(storedConfig);
      } else {
        throw new Error('Fawry service not initialized');
      }
    }
  }

  async createPaymentIntent(paymentInput: CreatePaymentInput): Promise<PaymentResponse> {
    try {
      await this.ensureInitialized();
      
      if (!this.config) {
        throw new Error('Fawry configuration not found');
      }

      const paymentRequest = this.buildPaymentRequest(paymentInput);
      
      // Generate signature
      const signature = await this.generateSignature(paymentRequest);
      paymentRequest.signature = signature;

      const response = await apiService.post('/fawry/payments', paymentRequest);
      
      return {
        success: true,
        paymentToken: response.data.referenceNumber,
        redirectUrl: response.data.url,
        payment: {
          id: paymentInput.orderId,
          orderId: paymentInput.orderId,
          userId: paymentInput.customerInfo.email,
          amount: paymentInput.amount,
          currency: paymentInput.currency,
          status: 'pending' as any,
          paymentMethod: paymentInput.paymentMethod,
          gateway: 'fawry' as any,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('Fawry payment creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed',
      };
    }
  }

  async processPayment(
    referenceNumber: string,
    paymentMethod: string,
    paymentDetails?: any
  ): Promise<PaymentResponse> {
    try {
      await this.ensureInitialized();

      if (!this.config) {
        throw new Error('Fawry configuration not found');
      }

      let paymentResult;

      switch (paymentMethod) {
        case 'card':
          paymentResult = await this.processCardPayment(referenceNumber, paymentDetails);
          break;
        
        case 'wallet':
          paymentResult = await this.processWalletPayment(referenceNumber, paymentDetails);
          break;
        
        case 'fawryplus':
          paymentResult = await this.processFawryPlusPayment(referenceNumber, paymentDetails);
          break;
        
        case 'cash_collection':
          paymentResult = await this.processCashCollectionPayment(referenceNumber);
          break;
        
        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }

      return paymentResult;
    } catch (error) {
      console.error('Fawry payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  private buildPaymentRequest(paymentInput: CreatePaymentInput): FawryPaymentRequest {
    const merchantRefNum = `${paymentInput.orderId}_${Date.now()}`;
    
    return {
      merchantCode: this.config!.merchantCode,
      merchantRefNum,
      customerProfileId: paymentInput.customerInfo.email,
      customerMobile: paymentInput.customerInfo.phone,
      customerEmail: paymentInput.customerInfo.email,
      amount: paymentInput.amount,
      currencyCode: paymentInput.currency,
      language: 'en',
      chargeItems: paymentInput.items.map(item => ({
        itemId: item.id,
        description: item.description || item.name,
        price: item.total,
        quantity: item.quantity,
      })),
      signature: '', // Will be generated
      paymentMethod: this.mapPaymentMethod(paymentInput.paymentMethod),
      description: `Payment for order ${paymentInput.orderId}`,
      paymentExpiry: 3600, // 1 hour
      allowValueEdit: false,
      merchantExtra: paymentInput.orderId,
      merchantExtra1: paymentInput.customerInfo.firstName,
      merchantExtra2: paymentInput.customerInfo.lastName,
      merchantExtra3: paymentInput.customerInfo.phone,
      merchantExtra4: paymentInput.customerInfo.email,
      merchantExtra5: JSON.stringify(paymentInput.metadata || {}),
      payMode: 'PayAtFawry',
    };
  }

  private mapPaymentMethod(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'credit_card':
      case 'debit_card':
        return 'CARD';
      case 'wallet':
        return 'WALLET';
      case 'bank_transfer':
        return 'BANK_TRANSFER';
      case 'cash_on_delivery':
        return 'CASH_COLLECTION';
      default:
        return 'CARD';
    }
  }

  private async generateSignature(paymentRequest: FawryPaymentRequest): Promise<string> {
    try {
      // Create signature string according to Fawry documentation
      const signatureString = [
        this.config!.merchantCode,
        paymentRequest.merchantRefNum,
        paymentRequest.customerProfileId,
        paymentRequest.amount,
        paymentRequest.currencyCode,
        this.config!.merchantSecretKey,
      ].join('');

      // Generate SHA256 hash
      const CryptoJS = require('crypto-js');
      return CryptoJS.SHA256(signatureString).toString().toUpperCase();
    } catch (error) {
      console.error('Signature generation failed:', error);
      throw error;
    }
  }

  private async processCardPayment(referenceNumber: string, cardDetails: any): Promise<PaymentResponse> {
    try {
      const response = await Fawry.processCardPayment({
        referenceNumber,
        cardNumber: cardDetails.cardNumber,
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear,
        cvv: cardDetails.cvv,
        holderName: cardDetails.holderName,
      });

      if (response.success) {
        return {
          success: true,
          payment: {
            id: response.referenceNumber,
            orderId: response.merchantRefNumber,
            userId: '',
            amount: response.amount || 0,
            currency: 'EGP',
            status: response.orderStatus === 'PAID' ? 'completed' as any : 'pending' as any,
            paymentMethod: 'credit_card' as any,
            gateway: 'fawry' as any,
            transactionId: response.referenceNumber,
            gatewayTransactionId: response.paymentRefNumber,
            gatewayResponse: response,
            completedAt: response.orderStatus === 'PAID' ? new Date().toISOString() : undefined,
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
      console.error('Fawry card payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Card payment failed',
      };
    }
  }

  private async processWalletPayment(referenceNumber: string, walletDetails: any): Promise<PaymentResponse> {
    try {
      const response = await Fawry.processWalletPayment({
        referenceNumber,
        walletType: walletDetails.walletType || 'FAWRY_WALLET',
        walletToken: walletDetails.walletToken,
      });

      if (response.success) {
        return {
          success: true,
          payment: {
            id: response.referenceNumber,
            orderId: response.merchantRefNumber,
            userId: '',
            amount: response.amount || 0,
            currency: 'EGP',
            status: response.orderStatus === 'PAID' ? 'completed' as any : 'pending' as any,
            paymentMethod: 'wallet' as any,
            gateway: 'fawry' as any,
            transactionId: response.referenceNumber,
            gatewayTransactionId: response.paymentRefNumber,
            gatewayResponse: response,
            completedAt: response.orderStatus === 'PAID' ? new Date().toISOString() : undefined,
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
      console.error('Fawry wallet payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Wallet payment failed',
      };
    }
  }

  private async processFawryPlusPayment(referenceNumber: string, plusDetails: any): Promise<PaymentResponse> {
    try {
      const response = await Fawry.processFawryPlusPayment({
        referenceNumber,
        plusToken: plusDetails.plusToken,
      });

      if (response.success) {
        return {
          success: true,
          payment: {
            id: response.referenceNumber,
            orderId: response.merchantRefNumber,
            userId: '',
            amount: response.amount || 0,
            currency: 'EGP',
            status: response.orderStatus === 'PAID' ? 'completed' as any : 'pending' as any,
            paymentMethod: 'wallet' as any,
            gateway: 'fawry' as any,
            transactionId: response.referenceNumber,
            gatewayTransactionId: response.paymentRefNumber,
            gatewayResponse: response,
            completedAt: response.orderStatus === 'PAID' ? new Date().toISOString() : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Fawry Plus payment failed',
        };
      }
    } catch (error) {
      console.error('Fawry Plus payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fawry Plus payment failed',
      };
    }
  }

  private async processCashCollectionPayment(referenceNumber: string): Promise<PaymentResponse> {
    try {
      const response = await Fawry.processCashCollectionPayment({
        referenceNumber,
      });

      if (response.success) {
        return {
          success: true,
          redirectUrl: response.url, // URL to pay at Fawry location
          payment: {
            id: response.referenceNumber,
            orderId: response.merchantRefNumber,
            userId: '',
            amount: response.amount || 0,
            currency: 'EGP',
            status: 'pending' as any, // Cash collection is always pending until paid
            paymentMethod: 'cash_on_delivery' as any,
            gateway: 'fawry' as any,
            transactionId: response.referenceNumber,
            gatewayTransactionId: response.paymentRefNumber,
            gatewayResponse: response,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Cash collection payment failed',
        };
      }
    } catch (error) {
      console.error('Fawry cash collection payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cash collection payment failed',
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
      console.error('Fawry callback verification failed:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Callback verification failed',
      };
    }
  }

  private async verifySignature(callback: PaymentCallback): Promise<boolean> {
    try {
      const expectedSignature = await this.generateCallbackSignature(callback);
      return callback.signature === expectedSignature;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  private async generateCallbackSignature(callback: PaymentCallback): Promise<string> {
    try {
      const signatureString = [
        this.config!.merchantCode,
        callback.paymentId,
        callback.transactionId,
        callback.amount,
        callback.currency,
        callback.timestamp,
        this.config!.merchantSecretKey,
      ].join('');

      const CryptoJS = require('crypto-js');
      return CryptoJS.SHA256(signatureString).toString().toUpperCase();
    } catch (error) {
      console.error('Callback signature generation failed:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      await this.ensureInitialized();
      
      const response = await apiService.get(`/fawry/payments/${paymentId}/status`);
      
      return {
        success: true,
        payment: response.data.payment,
      };
    } catch (error) {
      console.error('Fawry payment status check failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment status check failed',
      };
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
    try {
      await this.ensureInitialized();
      
      const response = await apiService.post(`/fawry/payments/${paymentId}/refund`, {
        amount,
        reason: 'Customer request',
      });
      
      return {
        success: true,
        payment: response.data.payment,
      };
    } catch (error) {
      console.error('Fawry refund failed:', error);
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
    return ['card', 'wallet', 'fawryplus', 'cash_collection'];
  }

  // Get available Fawry Plus locations
  async getFawryPlusLocations(): Promise<any[]> {
    try {
      await this.ensureInitialized();
      
      const response = await apiService.get('/fawry/locations');
      return response.data.locations;
    } catch (error) {
      console.error('Failed to get Fawry Plus locations:', error);
      return [];
    }
  }

  // Get cash collection points
  async getCashCollectionPoints(): Promise<any[]> {
    try {
      await this.ensureInitialized();
      
      const response = await apiService.get('/fawry/cash-collection-points');
      return response.data.points;
    } catch (error) {
      console.error('Failed to get cash collection points:', error);
      return [];
    }
  }
}

export const fawryService = new FawryService();

