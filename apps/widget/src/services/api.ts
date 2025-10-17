import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Event, TicketType, PaymentMethod, PurchaseData, PurchaseResult } from '../types/widget.types';
import { analytics } from './analytics';

class ApiService {
  private api: AxiosInstance;
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001/api' 
      : 'https://api.tazkartak.com/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add API key
    this.api.interceptors.request.use(
      (config) => {
        if (this.apiKey) {
          config.headers['X-API-Key'] = this.apiKey;
        }
        return config;
      },
      (error) => {
        analytics.trackError(error, 'api_request_interceptor');
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorMessage = error.response?.data?.message || error.message || 'API request failed';
        analytics.trackError(new Error(errorMessage), 'api_response_interceptor');
        return Promise.reject(error);
      }
    );
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  async getEvent(eventId: string): Promise<Event> {
    try {
      const response = await this.api.get(`/public/events/${eventId}`);
      const event = response.data.data;
      
      analytics.trackEventView(event.id, event.name);
      return event;
    } catch (error: any) {
      analytics.trackError(error, 'get_event');
      throw error;
    }
  }

  async getEventTickets(eventId: string): Promise<TicketType[]> {
    try {
      const response = await this.api.get(`/public/events/${eventId}/tickets`);
      return response.data.data;
    } catch (error: any) {
      analytics.trackError(error, 'get_event_tickets');
      throw error;
    }
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await this.api.get('/public/payment-methods');
      return response.data.data.methods;
    } catch (error: any) {
      analytics.trackError(error, 'get_payment_methods');
      throw error;
    }
  }

  async purchaseTickets(purchaseData: PurchaseData): Promise<PurchaseResult> {
    try {
      analytics.trackPaymentInitiated(purchaseData.paymentMethod, 
        purchaseData.quantity * (await this.getTicketTypePrice(purchaseData.ticketTypeId)));
      
      const response = await this.api.post('/public/tickets/purchase', purchaseData);
      const result = response.data.data;
      
      if (result.success) {
        analytics.trackPurchaseComplete(result.transactionId, result.amount, purchaseData.quantity);
        analytics.trackConversion(purchaseData.eventId || '', result.amount);
      }
      
      return result;
    } catch (error: any) {
      analytics.trackPurchaseError(error.message, 'purchase_tickets');
      throw error;
    }
  }

  async getTicketDetails(ticketId: string): Promise<any> {
    try {
      const response = await this.api.get(`/public/tickets/${ticketId}`);
      return response.data.data;
    } catch (error: any) {
      analytics.trackError(error, 'get_ticket_details');
      throw error;
    }
  }

  async validateQRCode(qrCode: string): Promise<any> {
    try {
      const response = await this.api.post('/public/qr/validate', { qrCode });
      return response.data.data;
    } catch (error: any) {
      analytics.trackError(error, 'validate_qr_code');
      throw error;
    }
  }

  async getHealth(): Promise<any> {
    try {
      const response = await this.api.get('/public/health');
      return response.data;
    } catch (error: any) {
      analytics.trackError(error, 'get_health');
      throw error;
    }
  }

  async getVersion(): Promise<any> {
    try {
      const response = await this.api.get('/public/version');
      return response.data;
    } catch (error: any) {
      analytics.trackError(error, 'get_version');
      throw error;
    }
  }

  // Helper method to get ticket type price (you might want to cache this)
  private async getTicketTypePrice(ticketTypeId: string): Promise<number> {
    try {
      // This would typically be cached or retrieved from the event data
      // For now, return 0 as placeholder
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // Caching utilities
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private setCache(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Cached versions of API calls
  async getEventCached(eventId: string): Promise<Event> {
    const cacheKey = `event_${eventId}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const event = await this.getEvent(eventId);
    this.setCache(cacheKey, event, 300000); // Cache for 5 minutes
    return event;
  }

  async getEventTicketsCached(eventId: string): Promise<TicketType[]> {
    const cacheKey = `tickets_${eventId}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const tickets = await this.getEventTickets(eventId);
    this.setCache(cacheKey, tickets, 60000); // Cache for 1 minute (more dynamic data)
    return tickets;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const apiService = new ApiService();
