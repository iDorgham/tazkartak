import { Request, Response, NextFunction } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/api.types';
import { EventService, CreateEventData, UpdateEventData, EventFilters } from '../services/event.service';
import { logger } from '../utils/logger.util';
import { CustomError } from '../middleware/errorHandler.middleware';
import { EventStatus, EventCategory } from '@prisma/client';
import prisma from '../config/database.config';

export const eventsController = {
  /**
   * @swagger
   * /api/events:
   *   get:
   *     summary: Get events with filtering and pagination
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for event name or description
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [MUSIC, SPORTS, CONFERENCE, EXHIBITION, WORKSHOP, FESTIVAL, WEDDING, CORPORATE, EDUCATION, OTHER]
   *         description: Filter by event category
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [DRAFT, PUBLISHED, LIVE, COMPLETED, CANCELLED]
   *         description: Filter by event status
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of events per page
   *     responses:
   *       200:
   *         description: List of events retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Event'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  getEvents: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        search,
        category,
        status,
        organizerId,
        venueId,
        startDate,
        endDate,
        isPublic,
        page = 1,
        limit = 10,
        sortBy = 'startDate',
        sortOrder = 'asc'
      } = req.query;

      const filters: EventFilters = {
        search: search as string,
        category: category as EventCategory,
        status: status as EventStatus,
        organizerId: organizerId as string,
        venueId: venueId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await EventService.getEvents(filters);

      const response: PaginatedResponse = {
        success: true,
        message: 'Events retrieved successfully',
        data: result.events,
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
   * @swagger
   * /api/events/{id}:
   *   get:
   *     summary: Get event by ID
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Event ID
   *     responses:
   *       200:
   *         description: Event retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/Event'
   *       404:
   *         description: Event not found
   *       500:
   *         description: Internal server error
   */
  getEventById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('Event ID is required', 400);
      }

      const event = await EventService.getEventById(id);

      const response: ApiResponse = {
        success: true,
        message: 'Event retrieved successfully',
        data: event
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new event
   */
  createEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        description,
        category,
        venueId,
        startDate,
        endDate,
        capacity,
        ticketTypes,
        imageUrl,
        isPublic = true
      } = req.body;

      const userId = (req as any).user?.id;
      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      // Get organizer ID from user
      const organizer = await prisma.organizer.findUnique({
        where: { userId }
      });

      if (!organizer) {
        throw new CustomError('User is not an organizer', 403);
      }

      const eventData: CreateEventData = {
        name,
        description,
        category,
        venueId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        capacity,
        ticketTypes,
        imageUrl,
        isPublic,
        organizerId: organizer.id
      };

      const event = await EventService.createEvent(eventData);

      const response: ApiResponse = {
        success: true,
        message: 'Event created successfully',
        data: event
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update an event
   */
  updateEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        throw new CustomError('Event ID is required', 400);
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      // Check if user owns the event
      const event = await EventService.getEventById(id);
      const organizer = await prisma.organizer.findUnique({
        where: { userId }
      });

      if (!organizer || event.organizerId !== organizer.id) {
        throw new CustomError('Not authorized to update this event', 403);
      }

      // Convert date strings to Date objects if provided
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }

      const updatedEvent = await EventService.updateEvent(id, updateData);

      const response: ApiResponse = {
        success: true,
        message: 'Event updated successfully',
        data: updatedEvent
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete an event
   */
  deleteEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('Event ID is required', 400);
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      // Check if user owns the event
      const event = await EventService.getEventById(id);
      const organizer = await prisma.organizer.findUnique({
        where: { userId }
      });

      if (!organizer || event.organizerId !== organizer.id) {
        throw new CustomError('Not authorized to delete this event', 403);
      }

      await EventService.deleteEvent(id);

      const response: ApiResponse = {
        success: true,
        message: 'Event deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Publish an event
   */
  publishEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('Event ID is required', 400);
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      // Check if user owns the event
      const event = await EventService.getEventById(id);
      const organizer = await prisma.organizer.findUnique({
        where: { userId }
      });

      if (!organizer || event.organizerId !== organizer.id) {
        throw new CustomError('Not authorized to publish this event', 403);
      }

      const updatedEvent = await EventService.updateEvent(id, { status: EventStatus.PUBLISHED });

      const response: ApiResponse = {
        success: true,
        message: 'Event published successfully',
        data: updatedEvent
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cancel an event
   */
  cancelEvent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        throw new CustomError('Event ID is required', 400);
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      // Check if user owns the event
      const event = await EventService.getEventById(id);
      const organizer = await prisma.organizer.findUnique({
        where: { userId }
      });

      if (!organizer || event.organizerId !== organizer.id) {
        throw new CustomError('Not authorized to cancel this event', 403);
      }

      const updatedEvent = await EventService.updateEvent(id, { 
        status: EventStatus.CANCELLED 
      });

      // TODO: Handle refunds for sold tickets
      // TODO: Send notifications to ticket holders

      const response: ApiResponse = {
        success: true,
        message: 'Event cancelled successfully',
        data: updatedEvent
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get events by organizer
   */
  getEventsByOrganizer: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      const organizer = await prisma.organizer.findUnique({
        where: { userId }
      });

      if (!organizer) {
        throw new CustomError('User is not an organizer', 403);
      }

      const {
        search,
        category,
        status,
        page = 1,
        limit = 10,
        sortBy = 'startDate',
        sortOrder = 'asc'
      } = req.query;

      const filters: Omit<EventFilters, 'organizerId'> = {
        search: search as string,
        category: category as EventCategory,
        status: status as EventStatus,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await EventService.getEventsByOrganizer(organizer.id, filters);

      const response: PaginatedResponse = {
        success: true,
        message: 'Organizer events retrieved successfully',
        data: result.events,
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
   * Get public events (for buyers)
   */
  getPublicEvents: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        search,
        category,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = 'startDate',
        sortOrder = 'asc'
      } = req.query;

      const filters: Omit<EventFilters, 'isPublic'> = {
        search: search as string,
        category: category as EventCategory,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await EventService.getPublicEvents(filters);

      const response: PaginatedResponse = {
        success: true,
        message: 'Public events retrieved successfully',
        data: result.events,
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
   * Get event statistics
   */
  getEventStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('Event ID is required', 400);
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      // Check if user owns the event
      const event = await EventService.getEventById(id);
      const organizer = await prisma.organizer.findUnique({
        where: { userId }
      });

      if (!organizer || event.organizerId !== organizer.id) {
        throw new CustomError('Not authorized to view this event stats', 403);
      }

      const stats = await EventService.getEventStats(id);

      const response: ApiResponse = {
        success: true,
        message: 'Event statistics retrieved successfully',
        data: stats
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
};
