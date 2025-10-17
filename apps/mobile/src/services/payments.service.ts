import { apiService } from './api.service';
import { API_ENDPOINTS } from '@/utils/constants';
import { Payment, PaymentFilters, InitiatePaymentRequest, PaymentCallback, RefundRequest, CreatePaymentInput, PaymentResponse, PaymentGateway, PaymentMethod } from '@/types/payment.types';
import { PaginatedResponse, ApiResponse } from '@/types/api.types';
import { paymentService } from './payment.service';

class PaymentsService {
  async getPayments(filters: PaymentFilters = {}): Promise<PaginatedResponse<Payment>> {
    const response = await apiService.get<PaginatedResponse<Payment>>('/payments', {
      params: filters,
    });
    return response.data;
  }

  async getPaymentById(paymentId: string): Promise<ApiResponse<Payment>> {
    const response = await apiService.get<ApiResponse<Payment>>(`/payments/${paymentId}`);
    return response.data;
  }

  async initiatePayment(paymentData: InitiatePaymentRequest): Promise<ApiResponse<Payment>> {
    const response = await apiService.post<ApiResponse<Payment>>(API_ENDPOINTS.PAYMENTS.INITIATE, paymentData);
    return response.data;
  }

  async checkPaymentStatus(paymentId: string): Promise<ApiResponse<Payment>> {
    const url = API_ENDPOINTS.PAYMENTS.STATUS.replace(':id', paymentId);
    const response = await apiService.get<ApiResponse<Payment>>(url);
    return response.data;
  }

  async requestRefund(paymentId: string, reason: string): Promise<ApiResponse<Payment>> {
    const url = API_ENDPOINTS.PAYMENTS.REFUND.replace(':id', paymentId);
    const response = await apiService.post<ApiResponse<Payment>>(url, { reason });
    return response.data;
  }

  async handlePaymentCallback(gateway: string, callbackData: any): Promise<ApiResponse<Payment>> {
    const url = API_ENDPOINTS.PAYMENTS.CALLBACK.replace(':gateway', gateway);
    const response = await apiService.post<ApiResponse<Payment>>(url, callbackData);
    return response.data;
  }

  async getPaymentMethods(): Promise<ApiResponse<any[]>> {
    const response = await apiService.get<ApiResponse<any[]>>('/payments/methods');
    return response.data;
  }

  async validatePaymentMethod(method: string, data: any): Promise<ApiResponse<{ isValid: boolean; error?: string }>> {
    const response = await apiService.post<ApiResponse<{ isValid: boolean; error?: string }>>('/payments/validate-method', {
      method,
      data,
    });
    return response.data;
  }

  async getPaymentAnalytics(): Promise<ApiResponse<any>> {
    const response = await apiService.get<ApiResponse<any>>('/payments/analytics');
    return response.data;
  }

  async exportPaymentHistory(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await apiService.get('/payments/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  // New payment methods using the unified payment service
  async createPayment(paymentInput: CreatePaymentInput): Promise<PaymentResponse> {
    try {
      return await paymentService.createPayment(paymentInput);
    } catch (error) {
      console.error('Failed to create payment:', error);
      throw error;
    }
  }

  async processPayment(
    paymentId: string, 
    paymentMethod: string, 
    paymentDetails?: any
  ): Promise<PaymentResponse> {
    try {
      return await paymentService.processPayment(paymentId, paymentMethod, paymentDetails);
    } catch (error) {
      console.error('Failed to process payment:', error);
      throw error;
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
    try {
      return await paymentService.refundPayment(paymentId, amount);
    } catch (error) {
      console.error('Failed to refund payment:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      return await paymentService.getPaymentStatus(paymentId);
    } catch (error) {
      console.error('Failed to get payment status:', error);
      throw error;
    }
  }

  async handlePaymentCallback(callback: any): Promise<PaymentResponse> {
    try {
      return await paymentService.handlePaymentCallback(callback);
    } catch (error) {
      console.error('Failed to handle payment callback:', error);
      throw error;
    }
  }

  // Get available payment methods for a gateway
  getAvailablePaymentMethods(gateway: PaymentGateway): string[] {
    return paymentService.getAvailablePaymentMethods(gateway);
  }

  // Check if a gateway is supported
  isGatewaySupported(gateway: PaymentGateway): boolean {
    return paymentService.isGatewaySupported(gateway);
  }

  // Initialize payment service
  async initialize(): Promise<void> {
    try {
      await paymentService.initialize();
    } catch (error) {
      console.error('Failed to initialize payment service:', error);
      throw error;
    }
  }

  // Process WebView payment
  async processWebViewPayment(
    paymentId: string,
    webViewRequest: any
  ): Promise<PaymentResponse> {
    try {
      return await paymentService.processWebViewPayment(paymentId, webViewRequest);
    } catch (error) {
      console.error('Failed to process WebView payment:', error);
      throw error;
    }
  }
}

export const paymentsService = new PaymentsService();