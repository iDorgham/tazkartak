import { apiService } from './api.service';

export interface Ticket {
  id: string;
  eventId: string;
  buyerId?: string;
  qrCode: string;
  price: number;
  currency: string;
  status: string;
  purchaseDate?: string;
  usedDate?: string;
  transferTo?: string;
  transferDate?: string;
  refundReason?: string;
  refundDate?: string;
  createdAt: string;
  updatedAt: string;
  event?: any;
  buyer?: any;
  payment?: any;
  qrScans?: any[];
}

export interface PurchaseTicketRequest {
  eventId: string;
  quantity: number;
  paymentMethod: string;
  buyerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface TicketFilters {
  eventId?: string;
  buyerId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface TicketResponse {
  success: boolean;
  message: string;
  data: {
    tickets: Ticket[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface SingleTicketResponse {
  success: boolean;
  message: string;
  data: Ticket;
}

export interface QRValidationRequest {
  qrCode: string;
}

export interface QRValidationResponse {
  success: boolean;
  message: string;
  data: {
    valid: boolean;
    ticket?: Ticket;
    event?: any;
    buyer?: any;
    alreadyUsed?: boolean;
    expired?: boolean;
  };
}

class TicketsService {
  async getTickets(params?: TicketFilters) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = queryParams.toString() ? `/tickets?${queryParams.toString()}` : '/tickets';
    return apiService.get<TicketResponse>(url);
  }

  async getTicketById(id: string) {
    return apiService.get<SingleTicketResponse>(`/tickets/${id}`);
  }

  async purchaseTickets(data: PurchaseTicketRequest) {
    return apiService.post<TicketResponse>('/tickets/purchase', data);
  }

  async validateTicket(data: QRValidationRequest) {
    return apiService.post<QRValidationResponse>('/tickets/validate', data);
  }

  async useTicket(ticketId: string, scannedBy?: string) {
    return apiService.put<SingleTicketResponse>(`/tickets/${ticketId}/use`, { scannedBy });
  }

  async refundTicket(ticketId: string, reason?: string) {
    return apiService.post<SingleTicketResponse>(`/tickets/${ticketId}/refund`, { reason });
  }

  async transferTicket(ticketId: string, newBuyerId: string) {
    return apiService.post<SingleTicketResponse>(`/tickets/${ticketId}/transfer`, { newBuyerId });
  }

  async getTicketsByEvent(eventId: string, params?: TicketFilters) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = queryParams.toString() ? `/tickets/event/${eventId}?${queryParams.toString()}` : `/tickets/event/${eventId}`;
    return apiService.get<TicketResponse>(url);
  }

  async getMyTickets(params?: TicketFilters) {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = queryParams.toString() ? `/tickets/my?${queryParams.toString()}` : '/tickets/my';
    return apiService.get<TicketResponse>(url);
  }

  async getTicketStats(eventId?: string) {
    const url = eventId ? `/tickets/stats?eventId=${eventId}` : '/tickets/stats';
    return apiService.get(url);
  }

  async getQRCode(ticketId: string) {
    return apiService.get(`/qr/${ticketId}`, {
      responseType: 'blob',
    });
  }

  async scanQRCode(qrCode: string, location?: string, device?: string) {
    return apiService.post('/qr/scan', {
      qrCode,
      location,
      device,
    });
  }

  async getQRScanHistory(ticketId: string) {
    return apiService.get(`/tickets/${ticketId}/scans`);
  }

  async getQRScanStats(eventId?: string) {
    const url = eventId ? `/qr/stats?eventId=${eventId}` : '/qr/stats';
    return apiService.get(url);
  }

  async bulkRefundTickets(ticketIds: string[], reason?: string) {
    return apiService.post('/tickets/bulk-refund', {
      ticketIds,
      reason,
    });
  }

  async bulkTransferTickets(ticketIds: string[], newBuyerId: string) {
    return apiService.post('/tickets/bulk-transfer', {
      ticketIds,
      newBuyerId,
    });
  }

  async resendTicketEmail(ticketId: string) {
    return apiService.post(`/tickets/${ticketId}/resend-email`);
  }

  async downloadTicket(ticketId: string) {
    return apiService.get(`/tickets/${ticketId}/download`, {
      responseType: 'blob',
    });
  }

  async downloadTicketsPDF(ticketIds: string[]) {
    return apiService.post('/tickets/download-pdf', {
      ticketIds,
    }, {
      responseType: 'blob',
    });
  }

  async getTicketAnalytics(eventId?: string, dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    const url = params.toString() ? `?${params.toString()}` : '';
    return apiService.get(`/tickets/analytics${url}`);
  }

  async exportTicketData(eventId?: string, format: 'csv' | 'excel' | 'pdf' = 'csv') {
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);
    params.append('format', format);
    
    return apiService.get(`/tickets/export?${params.toString()}`, {
      responseType: 'blob',
    });
  }

  async getTicketCategories() {
    return apiService.get('/tickets/categories');
  }

  async validateTicketData(data: PurchaseTicketRequest) {
    return apiService.post('/tickets/validate-data', data);
  }

  async checkTicketAvailability(eventId: string, quantity: number) {
    return apiService.get(`/tickets/availability?eventId=${eventId}&quantity=${quantity}`);
  }

  async getTicketRecommendations(ticketId: string, limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return apiService.get<TicketResponse>(`/tickets/${ticketId}/recommendations${params}`);
  }

  async generateTicketReport(eventId: string, type: 'sales' | 'usage' | 'refunds' = 'sales') {
    return apiService.get(`/tickets/report?eventId=${eventId}&type=${type}`, {
      responseType: 'blob',
    });
  }

  async getTicketTimeline(ticketId: string) {
    return apiService.get(`/tickets/${ticketId}/timeline`);
  }

  async updateTicketStatus(ticketId: string, status: string) {
    return apiService.put<SingleTicketResponse>(`/tickets/${ticketId}/status`, { status });
  }

  async getTicketInsights(eventId?: string) {
    const url = eventId ? `/tickets/insights?eventId=${eventId}` : '/tickets/insights';
    return apiService.get(url);
  }
}

export const ticketsService = new TicketsService();
