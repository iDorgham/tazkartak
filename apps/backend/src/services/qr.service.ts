import QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma } from '../config/database.config';
import { logger } from '../utils/logger.util';

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
  ticket?: any;
  event?: any;
  buyer?: any;
  error?: string;
  scanHistory?: any[];
}

export interface QRScanRecord {
  id: string;
  qrCode: string;
  scannedAt: Date;
  scannedBy: string;
  isValid: boolean;
  isDuplicate: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  deviceInfo?: {
    userAgent: string;
    ipAddress: string;
  };
}

class QRService {
  /**
   * Generate a unique QR code for a ticket
   */
  async generateQRCode(ticketId: string, eventId: string, buyerId: string): Promise<string> {
    try {
      // Create QR code data object
      const qrData: QRCodeData = {
        ticketId,
        eventId,
        buyerId,
        purchaseDate: new Date().toISOString(),
        hash: this.generateHash(ticketId, eventId, buyerId)
      };

      // Convert to JSON string
      const qrString = JSON.stringify(qrData);

      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      // Store QR code record in database
      await prisma.qRScan.create({
        data: {
          ticketId,
          qrCode: qrString,
          isValid: true,
          isScanned: false,
          createdAt: new Date()
        }
      });

      logger.info(`QR code generated for ticket ${ticketId}`);
      return qrCodeDataURL;

    } catch (error) {
      logger.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Validate a QR code and check for duplicates
   */
  async validateQRCode(
    qrCodeString: string, 
    scannedBy: string, 
    location?: { latitude: number; longitude: number },
    deviceInfo?: { userAgent: string; ipAddress: string }
  ): Promise<QRValidationResult> {
    try {
      // Parse QR code data
      let qrData: QRCodeData;
      try {
        qrData = JSON.parse(qrCodeString);
      } catch (parseError) {
        return {
          isValid: false,
          isUsed: false,
          error: 'Invalid QR code format'
        };
      }

      // Verify hash integrity
      const expectedHash = this.generateHash(qrData.ticketId, qrData.eventId, qrData.buyerId);
      if (qrData.hash !== expectedHash) {
        return {
          isValid: false,
          isUsed: false,
          error: 'QR code has been tampered with'
        };
      }

      // Find the QR code record
      const qrRecord = await prisma.qRScan.findFirst({
        where: {
          qrCode: qrCodeString,
          isValid: true
        },
        include: {
          ticket: {
            include: {
              event: true,
              buyer: true
            }
          }
        }
      });

      if (!qrRecord) {
        return {
          isValid: false,
          isUsed: false,
          error: 'QR code not found or invalid'
        };
      }

      // Check if already scanned
      if (qrRecord.isScanned) {
        return {
          isValid: true,
          isUsed: true,
          ticket: qrRecord.ticket,
          event: qrRecord.ticket?.event,
          buyer: qrRecord.ticket?.buyer,
          error: 'QR code has already been used',
          scanHistory: await this.getScanHistory(qrRecord.ticketId)
        };
      }

      // Check if ticket is valid and event is active
      if (!qrRecord.ticket || qrRecord.ticket.status !== 'CONFIRMED') {
        return {
          isValid: false,
          isUsed: false,
          error: 'Ticket is not confirmed'
        };
      }

      // Check if event is still active
      const now = new Date();
      const eventStart = new Date(qrRecord.ticket.event.startDate);
      const eventEnd = new Date(qrRecord.ticket.event.endDate);
      
      if (now < eventStart) {
        return {
          isValid: false,
          isUsed: false,
          error: 'Event has not started yet'
        };
      }

      if (now > eventEnd) {
        return {
          isValid: false,
          isUsed: false,
          error: 'Event has ended'
        };
      }

      // Mark as scanned and record scan
      await this.recordScan(qrRecord.ticketId, scannedBy, location, deviceInfo);

      return {
        isValid: true,
        isUsed: false,
        ticket: qrRecord.ticket,
        event: qrRecord.ticket.event,
        buyer: qrRecord.ticket.buyer
      };

    } catch (error) {
      logger.error('Error validating QR code:', error);
      return {
        isValid: false,
        isUsed: false,
        error: 'Internal server error during validation'
      };
    }
  }

  /**
   * Record a QR code scan
   */
  private async recordScan(
    ticketId: string,
    scannedBy: string,
    location?: { latitude: number; longitude: number },
    deviceInfo?: { userAgent: string; ipAddress: string }
  ): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Update QR record as scanned
        await tx.qRScan.updateMany({
          where: {
            ticketId,
            isValid: true
          },
          data: {
            isScanned: true,
            scannedAt: new Date(),
            scannedBy
          }
        });

        // Create scan record
        await tx.qRScan.create({
          data: {
            ticketId,
            qrCode: `scan-${Date.now()}-${ticketId}`,
            isValid: true,
            isScanned: true,
            scannedAt: new Date(),
            scannedBy,
            location: location ? JSON.stringify(location) : null,
            deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null
          }
        });

        // Update ticket status to used
        await tx.ticket.update({
          where: { id: ticketId },
          data: { 
            status: 'USED',
            usedAt: new Date()
          }
        });
      });

      logger.info(`QR code scan recorded for ticket ${ticketId} by ${scannedBy}`);

    } catch (error) {
      logger.error('Error recording QR scan:', error);
      throw new Error('Failed to record QR scan');
    }
  }

  /**
   * Get scan history for a ticket
   */
  async getScanHistory(ticketId: string): Promise<any[]> {
    try {
      const scans = await prisma.qRScan.findMany({
        where: {
          ticketId,
          isScanned: true
        },
        orderBy: {
          scannedAt: 'desc'
        },
        select: {
          scannedAt: true,
          scannedBy: true,
          location: true,
          deviceInfo: true
        }
      });

      return scans.map(scan => ({
        scannedAt: scan.scannedAt,
        scannedBy: scan.scannedBy,
        location: scan.location ? JSON.parse(scan.location) : null,
        deviceInfo: scan.deviceInfo ? JSON.parse(scan.deviceInfo) : null
      }));

    } catch (error) {
      logger.error('Error getting scan history:', error);
      return [];
    }
  }

  /**
   * Generate a hash for QR code integrity
   */
  private generateHash(ticketId: string, eventId: string, buyerId: string): string {
    const data = `${ticketId}-${eventId}-${buyerId}-${process.env.QR_SECRET || 'default-secret'}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Invalidate a QR code (for refunds, cancellations, etc.)
   */
  async invalidateQRCode(ticketId: string, reason: string): Promise<void> {
    try {
      await prisma.qRScan.updateMany({
        where: {
          ticketId,
          isValid: true
        },
        data: {
          isValid: false,
          updatedAt: new Date()
        }
      });

      logger.info(`QR code invalidated for ticket ${ticketId}. Reason: ${reason}`);

    } catch (error) {
      logger.error('Error invalidating QR code:', error);
      throw new Error('Failed to invalidate QR code');
    }
  }

  /**
   * Get QR code statistics for an event
   */
  async getQRStats(eventId: string): Promise<{
    totalTickets: number;
    scannedTickets: number;
    pendingTickets: number;
    invalidTickets: number;
    scanRate: number;
  }> {
    try {
      const [total, scanned, pending, invalid] = await Promise.all([
        prisma.qRScan.count({
          where: {
            ticket: { eventId },
            isValid: true
          }
        }),
        prisma.qRScan.count({
          where: {
            ticket: { eventId },
            isValid: true,
            isScanned: true
          }
        }),
        prisma.qRScan.count({
          where: {
            ticket: { eventId },
            isValid: true,
            isScanned: false
          }
        }),
        prisma.qRScan.count({
          where: {
            ticket: { eventId },
            isValid: false
          }
        })
      ]);

      return {
        totalTickets: total,
        scannedTickets: scanned,
        pendingTickets: pending,
        invalidTickets: invalid,
        scanRate: total > 0 ? (scanned / total) * 100 : 0
      };

    } catch (error) {
      logger.error('Error getting QR stats:', error);
      throw new Error('Failed to get QR statistics');
    }
  }

  /**
   * Bulk validate multiple QR codes
   */
  async bulkValidateQRCodes(
    qrCodes: string[], 
    scannedBy: string
  ): Promise<{
    valid: QRValidationResult[];
    invalid: QRValidationResult[];
  }> {
    const results = await Promise.all(
      qrCodes.map(qrCode => this.validateQRCode(qrCode, scannedBy))
    );

    return {
      valid: results.filter(result => result.isValid && !result.isUsed),
      invalid: results.filter(result => !result.isValid || result.isUsed)
    };
  }

  /**
   * Generate QR code for ticket purchase confirmation email
   */
  async generateQRCodeForEmail(ticketId: string): Promise<{
    qrCodeDataURL: string;
    qrCodeString: string;
  }> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          event: true,
          buyer: true
        }
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const qrData: QRCodeData = {
        ticketId: ticket.id,
        eventId: ticket.eventId,
        buyerId: ticket.buyerId,
        purchaseDate: ticket.createdAt.toISOString(),
        hash: this.generateHash(ticket.id, ticket.eventId, ticket.buyerId)
      };

      const qrString = JSON.stringify(qrData);
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return {
        qrCodeDataURL,
        qrCodeString
      };

    } catch (error) {
      logger.error('Error generating QR code for email:', error);
      throw new Error('Failed to generate QR code for email');
    }
  }
}

export const qrService = new QRService();
