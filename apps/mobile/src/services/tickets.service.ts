import { apiService } from './api.service';
import { cacheService } from './cache.service';
import { offlineService } from './offline.service';
import { qrEncryptionService } from './qr-encryption.service';
import { API_ENDPOINTS, CACHE_CONFIG } from '@/utils/constants';
import { Ticket, CreateTicketInput, TicketFilters, TicketTransferRequest, TicketRefundRequest } from '@/types/ticket.types';
import { PaginatedResponse, ApiResponse } from '@/types/api.types';
import NetInfo from '@react-native-community/netinfo';
import QRCode from 'qrcode';

class TicketsService {
  async getPurchasedTickets(filters: TicketFilters = {}): Promise<PaginatedResponse<Ticket>> {
    const response = await apiService.get<PaginatedResponse<Ticket>>(API_ENDPOINTS.TICKETS.LIST, {
      params: filters,
    });
    return response.data;
  }

  async getTicketById(ticketId: string): Promise<ApiResponse<Ticket>> {
    const url = API_ENDPOINTS.TICKETS.DETAIL.replace(':id', ticketId);
    const response = await apiService.get<ApiResponse<Ticket>>(url);
    return response.data;
  }

  async purchaseTicket(ticketData: CreateTicketInput): Promise<ApiResponse<Ticket>> {
    const response = await apiService.post<ApiResponse<Ticket>>(API_ENDPOINTS.TICKETS.PURCHASE, ticketData);
    return response.data;
  }

  async transferTicket(ticketId: string, email: string): Promise<ApiResponse<Ticket>> {
    const url = API_ENDPOINTS.TICKETS.TRANSFER.replace(':id', ticketId);
    const response = await apiService.post<ApiResponse<Ticket>>(url, { email });
    return response.data;
  }

  async requestRefund(ticketId: string, reason: string): Promise<ApiResponse<Ticket>> {
    const url = API_ENDPOINTS.TICKETS.REFUND.replace(':id', ticketId);
    const response = await apiService.post<ApiResponse<Ticket>>(url, { reason });
    return response.data;
  }

  async validateTicket(qrCode: string): Promise<ApiResponse<any>> {
    const response = await apiService.post<ApiResponse<any>>(API_ENDPOINTS.TICKETS.VALIDATE, { qrCode });
    return response.data;
  }

  async generateQRCode(ticketId: string): Promise<ApiResponse<{ qrCode: string; qrImage?: string }>> {
    const isConnected = await this.isOnline();
    
    if (isConnected) {
      try {
        const url = API_ENDPOINTS.TICKETS.QR_CODE.replace(':id', ticketId);
        const response = await apiService.get<ApiResponse<{ qrCode: string; qrImage?: string }>>(url);
        
        // Cache the QR code
        await this.cacheQRCode(ticketId, response.data.data.qrCode);
        
        return response.data;
      } catch (error) {
        // If API fails, try to generate QR code offline
        const offlineQR = await this.generateOfflineQRCode(ticketId);
        if (offlineQR) {
          return { data: offlineQR, success: true };
        }
        throw error;
      }
    } else {
      // Generate QR code offline
      const offlineQR = await this.generateOfflineQRCode(ticketId);
      if (offlineQR) {
        return { data: offlineQR, success: true };
      }
      throw new Error('Unable to generate QR code offline');
    }
  }

  async getTicketAnalytics(ticketId: string): Promise<ApiResponse<any>> {
    const url = `${API_ENDPOINTS.TICKETS.DETAIL.replace(':id', ticketId)}/analytics`;
    const response = await apiService.get<ApiResponse<any>>(url);
    return response.data;
  }

  async downloadTicket(ticketId: string): Promise<Blob> {
    const url = `${API_ENDPOINTS.TICKETS.DETAIL.replace(':id', ticketId)}/download`;
    const response = await apiService.get(url, {
      responseType: 'blob',
    });
    return response.data;
  }

  async shareTicket(ticketId: string, method: 'email' | 'sms' | 'link'): Promise<ApiResponse<any>> {
    const url = `${API_ENDPOINTS.TICKETS.DETAIL.replace(':id', ticketId)}/share`;
    const response = await apiService.post<ApiResponse<any>>(url, { method });
    return response.data;
  }

  // Offline ticket management methods
  private async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  private async generateOfflineQRCode(ticketId: string): Promise<{ qrCode: string; qrImage?: string } | null> {
    try {
      // Get cached ticket data
      const cachedTicket = await this.getCachedTicket(ticketId);
      if (!cachedTicket) {
        return null;
      }

      // Create encrypted QR data
      const qrData = {
        ticketId: cachedTicket.id,
        eventId: cachedTicket.eventId,
        userId: cachedTicket.userId,
        ticketTypeId: cachedTicket.ticketTypeId,
        purchaseDate: cachedTicket.createdAt,
        status: cachedTicket.status,
        signature: await qrEncryptionService.generateSignature(cachedTicket),
      };

      // Encrypt the QR data
      const encryptedData = await qrEncryptionService.encryptQRData(JSON.stringify(qrData));

      // Generate QR code image
      const qrImage = await QRCode.toDataURL(encryptedData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return {
        qrCode: encryptedData,
        qrImage,
      };
    } catch (error) {
      console.error('Error generating offline QR code:', error);
      return null;
    }
  }

  private async cacheQRCode(ticketId: string, qrCode: string): Promise<void> {
    await cacheService.set(`qr:${ticketId}`, qrCode, 24 * 60 * 60 * 1000); // 24 hours
  }

  async getCachedTicket(ticketId: string): Promise<Ticket | null> {
    try {
      const cachedTickets = await cacheService.getTickets();
      return cachedTickets?.find(ticket => ticket.id === ticketId) || null;
    } catch (error) {
      console.error('Error getting cached ticket:', error);
      return null;
    }
  }

  async getCachedTickets(filters: TicketFilters = {}): Promise<PaginatedResponse<Ticket> | null> {
    try {
      const cachedTickets = await cacheService.getTickets();
      if (!cachedTickets) {
        return null;
      }

      // Apply filters to cached data
      let filteredTickets = [...cachedTickets];

      // Filter by status
      if (filters.status) {
        filteredTickets = filteredTickets.filter(ticket => ticket.status === filters.status);
      }

      // Filter by event ID
      if (filters.eventId) {
        filteredTickets = filteredTickets.filter(ticket => ticket.eventId === filters.eventId);
      }

      // Filter by date range
      if (filters.startDate) {
        filteredTickets = filteredTickets.filter(ticket => 
          new Date(ticket.createdAt) >= new Date(filters.startDate!)
        );
      }

      if (filters.endDate) {
        filteredTickets = filteredTickets.filter(ticket => 
          new Date(ticket.createdAt) <= new Date(filters.endDate!)
        );
      }

      // Sort tickets
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      
      filteredTickets.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Ticket];
        let bValue: any = b[sortBy as keyof Ticket];

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Paginate results
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

      return {
        data: paginatedTickets,
        pagination: {
          page,
          limit,
          total: filteredTickets.length,
          totalPages: Math.ceil(filteredTickets.length / limit),
        },
      };
    } catch (error) {
      console.error('Error getting cached tickets:', error);
      return null;
    }
  }

  async validateOfflineQRCode(qrCode: string): Promise<{ valid: boolean; ticket?: Ticket; error?: string }> {
    try {
      // Decrypt QR code data
      const decryptedData = await qrEncryptionService.decryptQRData(qrCode);
      const qrData = JSON.parse(decryptedData);

      // Get cached ticket
      const ticket = await this.getCachedTicket(qrData.ticketId);
      if (!ticket) {
        return { valid: false, error: 'Ticket not found in cache' };
      }

      // Verify signature
      const isValidSignature = await qrEncryptionService.verifySignature(ticket, qrData.signature);
      if (!isValidSignature) {
        return { valid: false, error: 'Invalid QR code signature' };
      }

      // Check if ticket is valid for entry
      if (ticket.status !== 'SOLD' && ticket.status !== 'USED') {
        return { valid: false, error: 'Ticket is not valid for entry' };
      }

      // Check if ticket is for a past event
      const event = await cacheService.getEvent(ticket.eventId);
      if (event && new Date(event.endDate) < new Date()) {
        return { valid: false, error: 'Event has ended' };
      }

      return { valid: true, ticket };
    } catch (error) {
      console.error('Error validating offline QR code:', error);
      return { valid: false, error: 'Invalid QR code format' };
    }
  }

  async transferTicketOffline(ticketId: string, email: string): Promise<{ success: boolean; message: string }> {
    try {
      const ticket = await this.getCachedTicket(ticketId);
      if (!ticket) {
        return { success: false, message: 'Ticket not found' };
      }

      if (ticket.status !== 'SOLD') {
        return { success: false, message: 'Ticket cannot be transferred' };
      }

      // Add to offline queue for transfer
      await offlineService.performOptimisticUpdate(
        'TRANSFER_TICKET',
        { ticketId, email },
        { ...ticket, status: 'TRANSFERRING' },
        'high'
      );

      return { success: true, message: 'Transfer request queued for when online' };
    } catch (error) {
      console.error('Error transferring ticket offline:', error);
      return { success: false, message: 'Failed to queue transfer request' };
    }
  }

  async requestRefundOffline(ticketId: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      const ticket = await this.getCachedTicket(ticketId);
      if (!ticket) {
        return { success: false, message: 'Ticket not found' };
      }

      if (ticket.status !== 'SOLD') {
        return { success: false, message: 'Ticket cannot be refunded' };
      }

      // Add to offline queue for refund
      await offlineService.performOptimisticUpdate(
        'REQUEST_REFUND',
        { ticketId, reason },
        { ...ticket, status: 'REFUND_REQUESTED' },
        'high'
      );

      return { success: true, message: 'Refund request queued for when online' };
    } catch (error) {
      console.error('Error requesting refund offline:', error);
      return { success: false, message: 'Failed to queue refund request' };
    }
  }

  async clearTicketCache(): Promise<void> {
    await cacheService.clearByPattern(/^tickets?:|^ticket:/);
  }
}

export const ticketsService = new TicketsService();

