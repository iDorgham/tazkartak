import { Request, Response, NextFunction } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/api.types';
import { TicketService } from '../services/ticket.service';
import { logger } from '../utils/logger.util';
import { CustomError } from '../middleware/errorHandler.middleware';
import { TicketStatus } from '@prisma/client';

export const ticketsController = {
  /**
   * Get tickets with filtering and pagination
   */
  getTickets: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        eventId,
        buyerId,
        status,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // If not admin, only show user's own tickets
      let filters: any = {
        eventId: eventId as string,
        status: status as TicketStatus,
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

      const result = await TicketService.getTickets(filters);

      const response: PaginatedResponse = {
        success: true,
        message: 'Tickets retrieved successfully',
        data: result.tickets,
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
   * Get ticket by ID
   */
  getTicketById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('Ticket ID is required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const ticket = await TicketService.getTicketById(id);

      // Check if user can access this ticket
      if (userRole !== 'ADMIN' && ticket.buyerId !== userId) {
        throw new CustomError('Not authorized to view this ticket', 403);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Ticket retrieved successfully',
        data: ticket
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Purchase tickets
   */
  purchaseTickets: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        eventId,
        ticketTypeId,
        quantity,
        paymentMethod,
        customerData
      } = req.body;

      const userId = (req as any).user?.id;
      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      if (!eventId || !ticketTypeId || !quantity || !paymentMethod) {
        throw new CustomError('Missing required fields', 400);
      }

      const purchaseData = {
        eventId,
        ticketTypeId,
        quantity: parseInt(quantity),
        paymentMethod,
        customerData,
        buyerId: userId
      };

      const result = await TicketService.purchaseTickets(purchaseData);

      const response: ApiResponse = {
        success: true,
        message: 'Ticket purchase initiated successfully',
        data: result
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validate ticket (for venue staff)
   */
  validateTicket: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { qrCode } = req.body;

      if (!qrCode) {
        throw new CustomError('QR code is required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Only venue staff and admins can validate tickets
      if (userRole !== 'VENUE' && userRole !== 'ADMIN') {
        throw new CustomError('Not authorized to validate tickets', 403);
      }

      const result = await TicketService.validateTicket(qrCode, userId);

      const response: ApiResponse = {
        success: true,
        message: 'Ticket validated successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Use ticket (mark as used)
   */
  useTicket: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('Ticket ID is required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Only venue staff and admins can use tickets
      if (userRole !== 'VENUE' && userRole !== 'ADMIN') {
        throw new CustomError('Not authorized to use tickets', 403);
      }

      const ticket = await TicketService.useTicket(id, userId);

      const response: ApiResponse = {
        success: true,
        message: 'Ticket marked as used successfully',
        data: ticket
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Refund ticket
   */
  refundTicket: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        throw new CustomError('Ticket ID is required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Check if user can refund this ticket
      const ticket = await TicketService.getTicketById(id);
      
      if (userRole !== 'ADMIN' && ticket.buyerId !== userId) {
        throw new CustomError('Not authorized to refund this ticket', 403);
      }

      const result = await TicketService.refundTicket(id, reason, userId);

      const response: ApiResponse = {
        success: true,
        message: 'Ticket refunded successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Transfer ticket to another user
   */
  transferTicket: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { transferTo } = req.body;

      if (!id || !transferTo) {
        throw new CustomError('Ticket ID and transfer email are required', 400);
      }

      const userId = (req as any).user?.id;

      // Check if user owns this ticket
      const ticket = await TicketService.getTicketById(id);
      
      if (ticket.buyerId !== userId) {
        throw new CustomError('Not authorized to transfer this ticket', 403);
      }

      const result = await TicketService.transferTicket(id, transferTo, userId);

      const response: ApiResponse = {
        success: true,
        message: 'Ticket transfer initiated successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get user's tickets
   */
  getUserTickets: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      const {
        status,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        buyerId: userId,
        status: status as TicketStatus,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await TicketService.getTickets(filters);

      const response: PaginatedResponse = {
        success: true,
        message: 'User tickets retrieved successfully',
        data: result.tickets,
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
  }
};

