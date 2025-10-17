import { Request, Response } from 'express';
import { qrService } from '../services/qr.service';
import { logger } from '../utils/logger.util';
import { AuthRequest } from '../types/auth.types';

export class QRController {
  /**
   * Generate QR code for a ticket
   */
  generateQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { ticketId } = req.params;
      const { eventId, buyerId } = req.body;

      if (!eventId || !buyerId) {
        res.status(400).json({
          success: false,
          message: 'Event ID and Buyer ID are required'
        });
        return;
      }

      const qrCodeDataURL = await qrService.generateQRCode(ticketId, eventId, buyerId);

      res.json({
        success: true,
        data: {
          qrCode: qrCodeDataURL,
          ticketId
        }
      });

    } catch (error) {
      logger.error('Error generating QR code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate QR code'
      });
    }
  };

  /**
   * Validate a scanned QR code
   */
  validateQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { qrCode } = req.body;
      const scannedBy = req.user?.id || 'anonymous';
      
      // Extract location and device info from request
      const location = req.body.location;
      const deviceInfo = {
        userAgent: req.get('User-Agent') || '',
        ipAddress: req.ip || req.connection.remoteAddress || ''
      };

      if (!qrCode) {
        res.status(400).json({
          success: false,
          message: 'QR code is required'
        });
        return;
      }

      const result = await qrService.validateQRCode(qrCode, scannedBy, location, deviceInfo);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error validating QR code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate QR code'
      });
    }
  };

  /**
   * Get scan history for a ticket
   */
  getScanHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { ticketId } = req.params;

      const scanHistory = await qrService.getScanHistory(ticketId);

      res.json({
        success: true,
        data: scanHistory
      });

    } catch (error) {
      logger.error('Error getting scan history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scan history'
      });
    }
  };

  /**
   * Invalidate a QR code
   */
  invalidateQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { ticketId } = req.params;
      const { reason } = req.body;

      await qrService.invalidateQRCode(ticketId, reason || 'Manual invalidation');

      res.json({
        success: true,
        message: 'QR code invalidated successfully'
      });

    } catch (error) {
      logger.error('Error invalidating QR code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to invalidate QR code'
      });
    }
  };

  /**
   * Get QR statistics for an event
   */
  getQRStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { eventId } = req.params;

      const stats = await qrService.getQRStats(eventId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error getting QR stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get QR statistics'
      });
    }
  };

  /**
   * Bulk validate multiple QR codes
   */
  bulkValidateQRCodes = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { qrCodes } = req.body;
      const scannedBy = req.user?.id || 'anonymous';

      if (!qrCodes || !Array.isArray(qrCodes)) {
        res.status(400).json({
          success: false,
          message: 'QR codes array is required'
        });
        return;
      }

      if (qrCodes.length > 100) {
        res.status(400).json({
          success: false,
          message: 'Maximum 100 QR codes allowed per request'
        });
        return;
      }

      const results = await qrService.bulkValidateQRCodes(qrCodes, scannedBy);

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      logger.error('Error bulk validating QR codes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk validate QR codes'
      });
    }
  };

  /**
   * Generate QR code for email attachment
   */
  generateQRCodeForEmail = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { ticketId } = req.params;

      const result = await qrService.generateQRCodeForEmail(ticketId);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error generating QR code for email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate QR code for email'
      });
    }
  };

  /**
   * Get QR code info without scanning
   */
  getQRCodeInfo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { qrCode } = req.body;

      if (!qrCode) {
        res.status(400).json({
          success: false,
          message: 'QR code is required'
        });
        return;
      }

      // Parse QR code data without validating
      let qrData;
      try {
        qrData = JSON.parse(qrCode);
      } catch (parseError) {
        res.status(400).json({
          success: false,
          message: 'Invalid QR code format'
        });
        return;
      }

      // Get ticket and event info without scanning
      const { prisma } = await import('../config/database.config');
      const ticket = await prisma.ticket.findUnique({
        where: { id: qrData.ticketId },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              status: true,
              venue: {
                select: {
                  name: true,
                  location: true
                }
              }
            }
          },
          buyer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          ticket: {
            id: ticket.id,
            status: ticket.status,
            price: ticket.price,
            type: ticket.type,
            seatNumber: ticket.seatNumber
          },
          event: ticket.event,
          buyer: ticket.buyer,
          isScanned: ticket.status === 'USED'
        }
      });

    } catch (error) {
      logger.error('Error getting QR code info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get QR code information'
      });
    }
  };
}

export const qrController = new QRController();