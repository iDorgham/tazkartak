import CryptoJS from 'react-native-crypto';
import { QRPayload, Ticket } from '@/types/qr.types';

class QREncryptionService {
  private static readonly SECRET_KEY = 'tazkartak-qr-secret-key-2024'; // In production, use environment variable
  private static readonly ALGORITHM = 'AES-256-CBC';
  private static readonly HMAC_ALGORITHM = 'SHA256';

  /**
   * Generate encrypted QR payload for a ticket
   */
  static async encryptTicketData(
    ticketId: string,
    eventId: string,
    timestamp: number,
    ticket: Ticket
  ): Promise<string> {
    try {
      // Create payload object
      const payload = {
        ticketId,
        eventId,
        timestamp,
        ticket: {
          id: ticket.id,
          holderName: ticket.holderName,
          eventName: ticket.eventName,
          type: ticket.type,
          status: ticket.status,
        },
      };

      // Convert to JSON string
      const jsonPayload = JSON.stringify(payload);

      // Generate HMAC signature
      const signature = this.generateSignature(jsonPayload);

      // Add signature to payload
      const signedPayload = {
        ...payload,
        signature,
      };

      // Encrypt the signed payload
      const encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify(signedPayload),
        this.SECRET_KEY
      ).toString();

      return encryptedData;
    } catch (error) {
      console.error('QR encryption error:', error);
      throw new Error('Failed to encrypt ticket data');
    }
  }

  /**
   * Decrypt and validate QR payload
   */
  static async decryptAndValidate(qrData: string): Promise<QRPayload | null> {
    try {
      // Decrypt the data
      const decryptedBytes = CryptoJS.AES.decrypt(qrData, this.SECRET_KEY);
      const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedData) {
        throw new Error('Failed to decrypt QR data');
      }

      // Parse the decrypted JSON
      const payload: QRPayload = JSON.parse(decryptedData);

      // Validate required fields
      if (!payload.ticketId || !payload.eventId || !payload.timestamp || !payload.signature) {
        throw new Error('Invalid payload structure');
      }

      // Recreate the payload without signature for validation
      const payloadWithoutSignature = {
        ticketId: payload.ticketId,
        eventId: payload.eventId,
        timestamp: payload.timestamp,
        ticket: payload.ticket,
      };

      // Verify signature
      const isValidSignature = this.verifySignature(
        JSON.stringify(payloadWithoutSignature),
        payload.signature
      );

      if (!isValidSignature) {
        throw new Error('Invalid signature');
      }

      // Check timestamp (prevent replay attacks)
      const currentTime = Date.now();
      const payloadTime = payload.timestamp;
      const timeDifference = Math.abs(currentTime - payloadTime);

      // Allow 24 hours tolerance for offline scanning
      if (timeDifference > 24 * 60 * 60 * 1000) {
        throw new Error('QR code expired');
      }

      return payload;
    } catch (error) {
      console.error('QR decryption error:', error);
      return null;
    }
  }

  /**
   * Verify signature using HMAC-SHA256
   */
  static verifySignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = this.generateSignature(payload);
      return signature === expectedSignature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Generate ticket signature using HMAC-SHA256
   */
  static generateSignature(payload: string): string {
    try {
      const hmac = CryptoJS.HmacSHA256(payload, this.SECRET_KEY);
      return hmac.toString();
    } catch (error) {
      console.error('Signature generation error:', error);
      throw new Error('Failed to generate signature');
    }
  }

  /**
   * Generate a simple QR code data string for testing
   */
  static generateTestQRData(ticketId: string, eventId: string): string {
    const testTicket: Ticket = {
      id: ticketId,
      holderName: 'Test User',
      eventName: 'Test Event',
      type: 'General Admission',
      status: 'active',
      eventId,
      holderEmail: 'test@example.com',
      purchaseDate: new Date().toISOString(),
      price: 100,
      qrCode: 'test-qr-code',
    };

    return this.encryptTicketData(ticketId, eventId, Date.now(), testTicket);
  }

  /**
   * Validate ticket status and permissions
   */
  static validateTicketPermissions(
    payload: QRPayload,
    eventId?: string,
    venueId?: string
  ): { isValid: boolean; error?: string } {
    try {
      // Check if ticket is active
      if (payload.ticket.status !== 'active') {
        return { isValid: false, error: 'Ticket is not active' };
      }

      // Check event match if specified
      if (eventId && payload.eventId !== eventId) {
        return { isValid: false, error: 'Ticket is not for this event' };
      }

      // Additional venue validation could be added here
      // if (venueId && !this.isVenueAuthorized(payload.eventId, venueId)) {
      //   return { isValid: false, error: 'Venue not authorized for this event' };
      // }

      return { isValid: true };
    } catch (error) {
      console.error('Ticket validation error:', error);
      return { isValid: false, error: 'Validation failed' };
    }
  }

  /**
   * Check if QR code has been tampered with
   */
  static detectTampering(qrData: string): boolean {
    try {
      const payload = this.decryptAndValidate(qrData);
      return payload === null;
    } catch (error) {
      return true; // If decryption fails, assume tampering
    }
  }

  /**
   * Generate secure random string for additional security
   */
  static generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Create a time-limited QR code with expiration
   */
  static async createTimeLimitedQR(
    ticketId: string,
    eventId: string,
    ticket: Ticket,
    expirationHours: number = 24
  ): Promise<string> {
    const expirationTime = Date.now() + (expirationHours * 60 * 60 * 1000);
    return this.encryptTicketData(ticketId, eventId, expirationTime, ticket);
  }

  /**
   * Check if QR code is expired
   */
  static isQRExpired(payload: QRPayload): boolean {
    const currentTime = Date.now();
    return currentTime > payload.timestamp;
  }

  /**
   * Get remaining validity time for QR code
   */
  static getRemainingValidityTime(payload: QRPayload): number {
    const currentTime = Date.now();
    const remainingTime = payload.timestamp - currentTime;
    return Math.max(0, remainingTime);
  }

  /**
   * Format remaining time for display
   */
  static formatRemainingTime(remainingTime: number): string {
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'Expired';
    }
  }

  /**
   * Generate QR code with additional metadata
   */
  static async generateQRWithMetadata(
    ticketId: string,
    eventId: string,
    ticket: Ticket,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const enhancedTicket = {
      ...ticket,
      metadata: {
        ...metadata,
        generatedAt: new Date().toISOString(),
        version: '1.0',
        appVersion: '1.0.0', // Get from app version
      },
    };

    return this.encryptTicketData(ticketId, eventId, Date.now(), enhancedTicket);
  }

  /**
   * Extract metadata from QR payload
   */
  static extractMetadata(payload: QRPayload): Record<string, any> {
    return payload.ticket.metadata || {};
  }

  /**
   * Validate QR code version compatibility
   */
  static validateQRVersion(payload: QRPayload): boolean {
    const metadata = this.extractMetadata(payload);
    const qrVersion = metadata.version || '1.0';
    const appVersion = '1.0.0'; // Current app version
    
    // For now, accept all versions. In production, implement version checking
    return true;
  }
}

export { QREncryptionService };