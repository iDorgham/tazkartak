import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/event.service';
import { paymentService } from '../services/payment.service';
import { qrService } from '../services/qr.service';
import { AppError } from '../utils/appError.util';
import { catchAsync } from '../utils/catchAsync.util';
import { logger } from '../utils/logger.util';
import { ApiRequest } from '../middleware/apiAuth.middleware';

export const publicController = {
  /**
   * Get public events
   */
  getPublicEvents: catchAsync(async (req: ApiRequest, res: Response) => {
    const { page = 1, limit = 10, category, city, status, search } = req.query;

    const filters = {
      category: category as string,
      city: city as string,
      status: status as string,
      search: search as string
    };

    const events = await eventService.getPublicEvents(
      Number(page),
      Number(limit),
      filters
    );

    res.status(200).json({
      status: 'success',
      data: events
    });
  }),

  /**
   * Get event details
   */
  getEventById: catchAsync(async (req: ApiRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const event = await eventService.getEventById(id);
    
    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    // Check if event is public or if API key has access
    if (!event.isPublic && !req.apiKey) {
      return next(new AppError('Event not found', 404));
    }

    // If API key exists, check organizer ownership
    if (req.apiKey && event.organizerId !== req.apiKey.organizerId) {
      return next(new AppError('Access denied', 403));
    }

    res.status(200).json({
      status: 'success',
      data: { event }
    });
  }),

  /**
   * Get event tickets
   */
  getEventTickets: catchAsync(async (req: ApiRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const event = await eventService.getEventById(id);
    
    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    // Check if event is public or if API key has access
    if (!event.isPublic && !req.apiKey) {
      return next(new AppError('Event not found', 404));
    }

    // If API key exists, check organizer ownership
    if (req.apiKey && event.organizerId !== req.apiKey.organizerId) {
      return next(new AppError('Access denied', 403));
    }

    const tickets = event.ticketTypes.filter(ticket => ticket.isActive);

    res.status(200).json({
      status: 'success',
      data: { tickets }
    });
  }),

  /**
   * Purchase tickets
   */
  purchaseTickets: catchAsync(async (req: ApiRequest, res: Response, next: NextFunction) => {
    const {
      eventId,
      ticketTypeId,
      quantity,
      buyerInfo,
      paymentMethod
    } = req.body;

    if (!eventId || !ticketTypeId || !quantity || !buyerInfo || !paymentMethod) {
      return next(new AppError('Missing required fields', 400));
    }

    // Get event details
    const event = await eventService.getEventById(eventId);
    
    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    // Check if event is public or if API key has access
    if (!event.isPublic && !req.apiKey) {
      return next(new AppError('Event not found', 404));
    }

    // If API key exists, check organizer ownership
    if (req.apiKey && event.organizerId !== req.apiKey.organizerId) {
      return next(new AppError('Access denied', 403));
    }

    // Validate ticket type
    const ticketType = event.ticketTypes.find(t => t.id === ticketTypeId);
    if (!ticketType || !ticketType.isActive) {
      return next(new AppError('Invalid ticket type', 400));
    }

    // Check availability
    if (ticketType.availableQuantity < quantity) {
      return next(new AppError('Not enough tickets available', 400));
    }

    // Check quantity limits
    if (quantity > ticketType.maxPerOrder) {
      return next(new AppError(`Maximum ${ticketType.maxPerOrder} tickets per order`, 400));
    }

    try {
      const purchaseData = {
        eventId,
        ticketTypeId,
        quantity,
        amount: ticketType.price * quantity,
        currency: ticketType.currency,
        paymentMethod,
        buyerInfo,
        apiKeyId: req.apiKey?.id
      };

      const result = await paymentService.initiatePayment(purchaseData);

      res.status(200).json({
        status: 'success',
        message: 'Payment initiated successfully',
        data: result
      });
    } catch (error: any) {
      logger.error('Ticket purchase failed:', error);
      next(new AppError(error.message || 'Failed to process ticket purchase', 500));
    }
  }),

  /**
   * Get ticket details
   */
  getTicketDetails: catchAsync(async (req: ApiRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // This would typically require authentication to prevent unauthorized access
    // For now, we'll require API key authentication
    if (!req.apiKey) {
      return next(new AppError('Authentication required', 401));
    }

    // TODO: Implement ticket details retrieval
    // This would involve:
    // 1. Finding the ticket by ID
    // 2. Checking if the API key has access to this ticket's event
    // 3. Returning ticket information

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Ticket details endpoint not yet implemented'
      }
    });
  }),

  /**
   * Validate QR code
   */
  validateQRCode: catchAsync(async (req: ApiRequest, res: Response, next: NextFunction) => {
    const { qrCode } = req.body;

    if (!qrCode) {
      return next(new AppError('QR code is required', 400));
    }

    try {
      const validationResult = await qrService.validateQRCode(qrCode);

      res.status(200).json({
        status: 'success',
        data: validationResult
      });
    } catch (error: any) {
      logger.error('QR code validation failed:', error);
      next(new AppError(error.message || 'QR code validation failed', 500));
    }
  }),

  /**
   * Get payment methods
   */
  getPaymentMethods: catchAsync(async (req: Request, res: Response) => {
    const methods = [
      {
        code: 'paymob_card',
        name: 'Credit/Debit Card',
        description: 'Pay securely with your credit or debit card',
        gateway: 'paymob',
        icon: '💳'
      },
      {
        code: 'fawry_wallet',
        name: 'Fawry Wallet',
        description: 'Pay using your Fawry wallet',
        gateway: 'fawry',
        icon: '👛'
      },
      {
        code: 'fawry_payatfawry',
        name: 'Pay at Fawry',
        description: 'Pay at any Fawry outlet near you',
        gateway: 'fawry',
        icon: '🏪'
      },
      {
        code: 'fawry_valu',
        name: 'Valu Wallet',
        description: 'Pay using your Valu wallet',
        gateway: 'fawry',
        icon: '💰'
      },
      {
        code: 'fawry_meeza_wallet',
        name: 'Meeza Wallet',
        description: 'Pay using your Meeza wallet',
        gateway: 'fawry',
        icon: '💳'
      }
    ];

    res.status(200).json({
      status: 'success',
      data: { methods }
    });
  }),

  /**
   * Health check endpoint
   */
  getHealth: catchAsync(async (req: Request, res: Response) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected', // TODO: Add actual database health check
      redis: 'connected' // TODO: Add actual Redis health check
    };

    res.status(200).json({
      status: 'success',
      data: health
    });
  }),

  /**
   * API version endpoint
   */
  getVersion: catchAsync(async (req: Request, res: Response) => {
    const version = {
      api: process.env.npm_package_version || '1.0.0',
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      status: 'success',
      data: version
    });
  }),

  /**
   * Get API documentation
   */
  getApiDocs: catchAsync(async (req: Request, res: Response) => {
    const docs = {
      title: 'Tazkartak Public API',
      version: '1.0.0',
      description: 'Public API for Tazkartak event ticketing platform',
      baseUrl: `${req.protocol}://${req.get('host')}/api/public`,
      authentication: {
        type: 'API Key',
        header: 'X-API-Key',
        description: 'Include your API key in the X-API-Key header'
      },
      rateLimiting: {
        description: 'Rate limits are applied per API key',
        headers: [
          'X-RateLimit-Limit',
          'X-RateLimit-Remaining',
          'X-RateLimit-Reset'
        ]
      },
      endpoints: {
        'GET /events': 'List public events',
        'GET /events/:id': 'Get event details',
        'GET /events/:id/tickets': 'Get event tickets',
        'POST /tickets/purchase': 'Purchase tickets',
        'GET /tickets/:id': 'Get ticket details',
        'POST /qr/validate': 'Validate QR code',
        'GET /payment-methods': 'Get available payment methods',
        'GET /health': 'API health check',
        'GET /version': 'API version info'
      },
      documentation: `${req.protocol}://${req.get('host')}/api/docs`
    };

    res.status(200).json({
      status: 'success',
      data: docs
    });
  })
};
