import { api } from './api.service';

export interface QRCodeData {
  ticketId: string;
  eventId: string;
  buyerId: string;
  purchaseDate: string;
  hash: string;
}

export interface QRValidationResult {
  isValid: boolean;
  isUsed: boolean;
  ticket?: {
    id: string;
    status: string;
    price: number;
    type: string;
    seatNumber?: string;
  };
  event?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    venue: {
      name: string;
      location: string;
    };
  };
  buyer?: {
    id: string;
    name: string;
    email: string;
  };
  error?: string;
  scanHistory?: Array<{
    scannedAt: string;
    scannedBy: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    deviceInfo?: {
      userAgent: string;
      ipAddress: string;
    };
  }>;
}

export interface QRStats {
  totalTickets: number;
  scannedTickets: number;
  pendingTickets: number;
  invalidTickets: number;
  scanRate: number;
}

export interface BulkValidationResult {
  valid: QRValidationResult[];
  invalid: QRValidationResult[];
}

export interface QRCodeInfo {
  qrCode: string;
  ticketId: string;
}

export interface QRCodeEmailData {
  qrCodeDataURL: string;
  qrCodeString: string;
}

class QRService {
  /**
   * Generate QR code for a ticket
   */
  async generateQRCode(ticketId: string, eventId: string, buyerId: string): Promise<QRCodeInfo> {
    const response = await api.post(`/qr/generate/${ticketId}`, {
      eventId,
      buyerId
    });
    return response.data.data;
  }

  /**
   * Validate a scanned QR code
   */
  async validateQRCode(
    qrCode: string, 
    location?: { latitude: number; longitude: number }
  ): Promise<QRValidationResult> {
    const response = await api.post('/qr/validate', {
      qrCode,
      location
    });
    return response.data.data;
  }

  /**
   * Get QR code information without scanning
   */
  async getQRCodeInfo(qrCode: string): Promise<{
    ticket: any;
    event: any;
    buyer: any;
    isScanned: boolean;
  }> {
    const response = await api.post('/qr/info', { qrCode });
    return response.data.data;
  }

  /**
   * Get scan history for a ticket
   */
  async getScanHistory(ticketId: string): Promise<Array<{
    scannedAt: string;
    scannedBy: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    deviceInfo?: {
      userAgent: string;
      ipAddress: string;
    };
  }>> {
    const response = await api.get(`/qr/history/${ticketId}`);
    return response.data.data;
  }

  /**
   * Invalidate a QR code
   */
  async invalidateQRCode(ticketId: string, reason: string): Promise<{ message: string }> {
    const response = await api.post(`/qr/invalidate/${ticketId}`, { reason });
    return response.data;
  }

  /**
   * Get QR statistics for an event
   */
  async getQRStats(eventId: string): Promise<QRStats> {
    const response = await api.get(`/qr/stats/${eventId}`);
    return response.data.data;
  }

  /**
   * Bulk validate multiple QR codes
   */
  async bulkValidateQRCodes(qrCodes: string[]): Promise<BulkValidationResult> {
    const response = await api.post('/qr/bulk-validate', { qrCodes });
    return response.data.data;
  }

  /**
   * Generate QR code for email attachment
   */
  async generateQRCodeForEmail(ticketId: string): Promise<QRCodeEmailData> {
    const response = await api.get(`/qr/email/${ticketId}`);
    return response.data.data;
  }

  /**
   * Parse QR code string to get ticket information
   */
  parseQRCode(qrCodeString: string): QRCodeData | null {
    try {
      const qrData = JSON.parse(qrCodeString);
      
      // Validate required fields
      if (!qrData.ticketId || !qrData.eventId || !qrData.buyerId || !qrData.hash) {
        return null;
      }

      return qrData;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate QR code hash for validation
   */
  generateHash(ticketId: string, eventId: string, buyerId: string): string {
    // This should match the backend hash generation
    // For security, the actual secret should be kept on the backend
    const data = `${ticketId}-${eventId}-${buyerId}`;
    // Simple hash for client-side validation (backend will do the real validation)
    return btoa(data).substring(0, 16);
  }

  /**
   * Check if QR code is expired based on event date
   */
  isQRCodeExpired(qrData: QRCodeData, eventEndDate: string): boolean {
    const now = new Date();
    const endDate = new Date(eventEndDate);
    return now > endDate;
  }

  /**
   * Check if QR code is for future event
   */
  isQRCodeForFutureEvent(qrData: QRCodeData, eventStartDate: string): boolean {
    const now = new Date();
    const startDate = new Date(eventStartDate);
    return now < startDate;
  }
}

export const qrService = new QRService();
