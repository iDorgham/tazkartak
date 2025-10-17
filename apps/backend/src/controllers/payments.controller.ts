import { Request, Response, NextFunction } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/api.types';
import { PaymentService, PaymentInitiationData } from '../services/payment.service';
import { logger } from '../utils/logger.util';
import { CustomError } from '../middleware/errorHandler.middleware';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

export const paymentsController = {
  /**
   * Get payments with filtering and pagination
   */
  getPayments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        status,
        method,
        buyerId,
        eventId,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // If not admin, only show user's own payments
      let filters: any = {
        status: status as PaymentStatus,
        method: method as PaymentMethod,
        eventId: eventId as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      if (userRole !== 'ADMIN') {
        filters.buyerId = userId;
      } else if (buyerId) {
        filters.buyerId = buyerId as string;
      }

      const result = await PaymentService.getPayments(filters);

      const response: PaginatedResponse = {
        success: true,
        message: 'Payments retrieved successfully',
        data: result.payments,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.totalPages,
          hasNext: result.page < result.totalPages,
          hasPrev: result.page > 1
        }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get payment by ID
   */
  getPaymentById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('Payment ID is required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const payment = await PaymentService.getPaymentById(id);

      // Check if user can access this payment
      if (userRole !== 'ADMIN' && payment.buyerId !== userId) {
        throw new CustomError('Not authorized to view this payment', 403);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Payment retrieved successfully',
        data: payment
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Initiate payment
   */
  initiatePayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        eventId,
        ticketTypeId,
        quantity,
        paymentMethod,
        customerData,
        returnUrl
      } = req.body;

      const userId = (req as any).user?.id;
      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      if (!eventId || !ticketTypeId || !quantity || !paymentMethod || !customerData) {
        throw new CustomError('Missing required fields', 400);
      }

      const paymentData: PaymentInitiationData = {
        eventId,
        ticketTypeId,
        quantity: parseInt(quantity),
        paymentMethod,
        customerData,
        buyerId: userId,
        returnUrl
      };

      const result = await PaymentService.initiatePayment(paymentData);

      const response: ApiResponse = {
        success: true,
        message: 'Payment initiated successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * PayMob callback
   */
  paymobCallback: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const callbackData = req.body;

      const result = await PaymentService.handlePayMobCallback(callbackData);

      const response: ApiResponse = {
        success: true,
        message: 'PayMob callback processed successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('PayMob callback error:', error);
      next(error);
    }
  },

  /**
   * Fawry callback
   */
  fawryCallback: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const callbackData = req.body;

      const result = await PaymentService.handleFawryCallback(callbackData);

      const response: ApiResponse = {
        success: true,
        message: 'Fawry callback processed successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Fawry callback error:', error);
      next(error);
    }
  },

  /**
   * PayMob webhook
   */
  paymobWebhook: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const webhookData = req.body;

      // Verify webhook signature
      const isValid = await PaymentService.verifyPayMobWebhook(req.headers, webhookData);
      
      if (!isValid) {
        throw new CustomError('Invalid webhook signature', 401);
      }

      const result = await PaymentService.handlePayMobWebhook(webhookData);

      const response: ApiResponse = {
        success: true,
        message: 'PayMob webhook processed successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('PayMob webhook error:', error);
      next(error);
    }
  },

  /**
   * Fawry webhook
   */
  fawryWebhook: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const webhookData = req.body;

      // Verify webhook signature
      const isValid = await PaymentService.verifyFawryWebhook(req.headers, webhookData);
      
      if (!isValid) {
        throw new CustomError('Invalid webhook signature', 401);
      }

      const result = await PaymentService.handleFawryWebhook(webhookData);

      const response: ApiResponse = {
        success: true,
        message: 'Fawry webhook processed successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Fawry webhook error:', error);
      next(error);
    }
  },

  /**
   * Process refund
   */
  processRefund: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason, amount } = req.body;

      if (!id) {
        throw new CustomError('Payment ID is required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Check if user can refund this payment
      const payment = await PaymentService.getPaymentById(id);
      
      if (userRole !== 'ADMIN' && payment.buyerId !== userId) {
        throw new CustomError('Not authorized to refund this payment', 403);
      }

      const result = await PaymentService.processRefund(id, reason, amount, userId);

      const response: ApiResponse = {
        success: true,
        message: 'Refund processed successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get payment statistics
   */
  getPaymentStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      let stats;
      if (userRole === 'ADMIN') {
        stats = await PaymentService.getAdminPaymentStats();
      } else {
        stats = await PaymentService.getUserPaymentStats(userId);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: stats
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
};

