import { apiService } from './api.service';
import { API_ENDPOINTS } from '@/utils/constants';
import { QRCode, QRScanResult, QRGenerationRequest, QRValidationResult, QRScanRequest, QRScanResponse } from '@/types/qr.types';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';

class QRService {
  async generateQRCode(request: QRGenerationRequest): Promise<ApiResponse<QRCode>> {
    const response = await apiService.post<ApiResponse<QRCode>>(API_ENDPOINTS.QR.GENERATE, request);
    return response.data;
  }

  async scanQRCode(qrData: string): Promise<ApiResponse<QRScanResult>> {
    const response = await apiService.post<ApiResponse<QRScanResult>>(API_ENDPOINTS.QR.SCAN, { qrData });
    return response.data;
  }

  async getScanHistory(): Promise<PaginatedResponse<QRScanResult>> {
    const response = await apiService.get<PaginatedResponse<QRScanResult>>(API_ENDPOINTS.QR.HISTORY);
    return response.data;
  }

  async validateQRCode(qrData: string): Promise<ApiResponse<QRValidationResult>> {
    const response = await apiService.post<ApiResponse<QRValidationResult>>('/qr/validate', { qrData });
    return response.data;
  }

  async getQRCodeById(qrId: string): Promise<ApiResponse<QRCode>> {
    const response = await apiService.get<ApiResponse<QRCode>>(`/qr/${qrId}`);
    return response.data;
  }

  async regenerateQRCode(ticketId: string): Promise<ApiResponse<QRCode>> {
    const response = await apiService.post<ApiResponse<QRCode>>('/qr/regenerate', { ticketId });
    return response.data;
  }

  async getQRCodeAnalytics(): Promise<ApiResponse<any>> {
    const response = await apiService.get<ApiResponse<any>>('/qr/analytics');
    return response.data;
  }

  async bulkScanQR(qrDataList: string[]): Promise<ApiResponse<QRScanResult[]>> {
    const response = await apiService.post<ApiResponse<QRScanResult[]>>('/qr/bulk-scan', { qrDataList });
    return response.data;
  }

  async exportScanHistory(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await apiService.get('/qr/export-history', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  async scanTicket(scanRequest: QRScanRequest): Promise<QRScanResponse> {
    const response = await apiService.post<QRScanResponse>('/qr/scan-ticket', scanRequest);
    return response.data;
  }

  async checkTicketScanned(ticketId: string): Promise<boolean> {
    try {
      const response = await apiService.get<ApiResponse<boolean>>(`/qr/check-scanned/${ticketId}`);
      return response.data.data || false;
    } catch (error) {
      console.error('Error checking if ticket is scanned:', error);
      return false;
    }
  }

  async getScanHistoryByEvent(eventId: string): Promise<PaginatedResponse<QRScanResult>> {
    const response = await apiService.get<PaginatedResponse<QRScanResult>>(`/qr/scan-history/event/${eventId}`);
    return response.data;
  }

  async getScanHistoryByVenue(venueId: string): Promise<PaginatedResponse<QRScanResult>> {
    const response = await apiService.get<PaginatedResponse<QRScanResult>>(`/qr/scan-history/venue/${venueId}`);
    return response.data;
  }

  async getScanStats(eventId?: string, venueId?: string): Promise<ApiResponse<any>> {
    const params: any = {};
    if (eventId) params.eventId = eventId;
    if (venueId) params.venueId = venueId;
    
    const response = await apiService.get<ApiResponse<any>>('/qr/scan-stats', { params });
    return response.data;
  }
}

export const qrService = new QRService();
