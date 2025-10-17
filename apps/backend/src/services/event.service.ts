import { Prisma, Event, EventStatus } from '@prisma/client';
import prisma from '../config/database.config';
import { subscriptionService } from './subscription.service';
import { logger } from '../utils/logger.util';
import { CustomError } from '../middleware/errorHandler.middleware';

export interface CreateEventData {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  venueId?: string;
  category: string;
  capacity: number;
  ticketTypes: Array<{
    name: string;
    price: number;
    quantity: number;
    description?: string;
  }>;
  imageUrl?: string;
  isPublic: boolean;
  organizerId: string;
}

export interface UpdateEventData {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  venueId?: string;
  category?: string;
  capacity?: number;
  ticketTypes?: Array<{
    id?: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
  }>;
  imageUrl?: string;
  isPublic?: boolean;
  status?: EventStatus;
}

export interface EventFilters {
  search?: string;
  category?: string;
  status?: EventStatus;
  organizerId?: string;
  venueId?: string;
  startDate?: Date;
  endDate?: Date;
  isPublic?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'startDate' | 'createdAt' | 'capacity';
  sortOrder?: 'asc' | 'desc';
}

export interface EventWithDetails extends Event {
  organizer: {
    id: string;
    name: string;
    contactEmail: string;
  };
  venue?: {
    id: string;
    name: string;
    location: string;
    capacity: number;
  };
  ticketTypes: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    sold: number;
    description?: string;
  }>;
  _count: {
    tickets: number;
  };
}

export class EventService {
  /**
   * Create a new event
   */
  static async createEvent(data: CreateEventData): Promise<EventWithDetails> {
    try {
      // Validate organizer exists and has permission
      const organizer = await prisma.organizer.findUnique({
        where: { id: data.organizerId },
        include: { user: true }
      });

      if (!organizer) {
        throw new CustomError('Organizer not found', 404);
      }

      // Check subscription limits
      const canCreateEvent = await subscriptionService.canCreateEvent(organizer.userId);
      if (!canCreateEvent.allowed) {
        throw new CustomError(canCreateEvent.reason || 'Event creation not allowed', 403);
      }

      // Validate venue if provided
      if (data.venueId) {
        const venue = await prisma.venue.findUnique({
          where: { id: data.venueId }
        });

        if (!venue) {
          throw new CustomError('Venue not found', 404);
        }

        // Check if venue capacity is sufficient
        if (venue.capacity < data.capacity) {
          throw new CustomError('Event capacity exceeds venue capacity', 400);
        }
      }

      // Validate dates
      if (data.startDate >= data.endDate) {
        throw new CustomError('End date must be after start date', 400);
      }

      if (data.startDate <= new Date()) {
        throw new CustomError('Start date must be in the future', 400);
      }

      // Calculate total ticket quantity
      const totalTickets = data.ticketTypes.reduce((sum, type) => sum + type.quantity, 0);
      if (totalTickets !== data.capacity) {
        throw new CustomError('Total ticket quantity must match event capacity', 400);
      }

      // Create event with ticket types in a transaction
      const event = await prisma.$transaction(async (tx) => {
        // Create the event
        const newEvent = await tx.event.create({
          data: {
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            venueId: data.venueId,
            category: data.category,
            capacity: data.capacity,
            imageUrl: data.imageUrl,
            isPublic: data.isPublic,
            organizerId: data.organizerId,
            status: EventStatus.DRAFT,
          },
        });

        // Create ticket types
        const ticketTypeData = data.ticketTypes.map(type => ({
          name: type.name,
          price: type.price,
          quantity: type.quantity,
          description: type.description,
          eventId: newEvent.id,
          sold: 0,
        }));

        await tx.ticketType.createMany({
          data: ticketTypeData,
        });

        return newEvent;
      });

      logger.info(`Event created successfully: ${event.id} by organizer ${data.organizerId}`);

      // Track event creation for subscription usage
      try {
        await subscriptionService.trackEventCreation(organizer.userId, event.id);
      } catch (usageError) {
        logger.warn('Failed to track event creation for subscription usage:', usageError);
        // Don't fail the event creation if usage tracking fails
      }

      // Return event with details
      return this.getEventById(event.id);
    } catch (error: any) {
      logger.error('Failed to create event:', error);
      throw error;
    }
  }

  /**
   * Get event by ID with full details
   */
  static async getEventById(id: string): Promise<EventWithDetails> {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              contactEmail: true,
            },
          },
          venue: {
            select: {
              id: true,
              name: true,
              location: true,
              capacity: true,
            },
          },
          ticketTypes: {
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
              sold: true,
              description: true,
            },
          },
          _count: {
            select: {
              tickets: true,
            },
          },
        },
      });

      if (!event) {
        throw new CustomError('Event not found', 404);
      }

      return event as EventWithDetails;
    } catch (error: any) {
      logger.error('Failed to get event by ID:', error);
      throw error;
    }
  }

  /**
   * Get events with filtering and pagination
   */
  static async getEvents(filters: EventFilters = {}): Promise<{
    events: EventWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
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
        sortOrder = 'asc',
      } = filters;

      // Build where clause
      const where: Prisma.EventWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category) {
        where.category = category;
      }

      if (status) {
        where.status = status;
      }

      if (organizerId) {
        where.organizerId = organizerId;
      }

      if (venueId) {
        where.venueId = venueId;
      }

      if (startDate) {
        where.startDate = { gte: startDate };
      }

      if (endDate) {
        where.endDate = { lte: endDate };
      }

      if (isPublic !== undefined) {
        where.isPublic = isPublic;
      }

      // Build orderBy clause
      const orderBy: Prisma.EventOrderByWithRelationInput = {};
      orderBy[sortBy] = sortOrder;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          include: {
            organizer: {
              select: {
                id: true,
                name: true,
                contactEmail: true,
              },
            },
            venue: {
              select: {
                id: true,
                name: true,
                location: true,
                capacity: true,
              },
            },
            ticketTypes: {
              select: {
                id: true,
                name: true,
                price: true,
                quantity: true,
                sold: true,
                description: true,
              },
            },
            _count: {
              select: {
                tickets: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.event.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        events: events as EventWithDetails[],
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error: any) {
      logger.error('Failed to get events:', error);
      throw error;
    }
  }

  /**
   * Update an event
   */
  static async updateEvent(id: string, data: UpdateEventData, userId: string): Promise<EventWithDetails> {
    try {
      // Get the event first
      const existingEvent = await prisma.event.findUnique({
        where: { id },
        include: { organizer: true },
      });

      if (!existingEvent) {
        throw new CustomError('Event not found', 404);
      }

      // Check if user has permission to update this event
      const organizer = await prisma.organizer.findUnique({
        where: { userId },
      });

      if (!organizer || organizer.id !== existingEvent.organizerId) {
        throw new CustomError('You can only update your own events', 403);
      }

      // Check if event can be updated (not published or completed)
      if (existingEvent.status === EventStatus.PUBLISHED || existingEvent.status === EventStatus.COMPLETED) {
        throw new CustomError('Cannot update published or completed events', 400);
      }

      // Validate venue if being updated
      if (data.venueId) {
        const venue = await prisma.venue.findUnique({
          where: { id: data.venueId },
        });

        if (!venue) {
          throw new CustomError('Venue not found', 404);
        }

        const capacity = data.capacity || existingEvent.capacity;
        if (venue.capacity < capacity) {
          throw new CustomError('Event capacity exceeds venue capacity', 400);
        }
      }

      // Validate dates if being updated
      const startDate = data.startDate || existingEvent.startDate;
      const endDate = data.endDate || existingEvent.endDate;

      if (startDate >= endDate) {
        throw new CustomError('End date must be after start date', 400);
      }

      // Update event and ticket types in a transaction
      const event = await prisma.$transaction(async (tx) => {
        // Update the event
        const updatedEvent = await tx.event.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            venueId: data.venueId,
            category: data.category,
            capacity: data.capacity,
            imageUrl: data.imageUrl,
            isPublic: data.isPublic,
            status: data.status,
          },
        });

        // Update ticket types if provided
        if (data.ticketTypes) {
          // Delete existing ticket types
          await tx.ticketType.deleteMany({
            where: { eventId: id },
          });

          // Create new ticket types
          const ticketTypeData = data.ticketTypes.map(type => ({
            name: type.name,
            price: type.price,
            quantity: type.quantity,
            description: type.description,
            eventId: id,
            sold: 0, // Reset sold count when updating
          }));

          await tx.ticketType.createMany({
            data: ticketTypeData,
          });
        }

        return updatedEvent;
      });

      logger.info(`Event updated successfully: ${id} by user ${userId}`);

      return this.getEventById(id);
    } catch (error: any) {
      logger.error('Failed to update event:', error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  static async deleteEvent(id: string, userId: string): Promise<void> {
    try {
      // Get the event first
      const event = await prisma.event.findUnique({
        where: { id },
        include: { 
          organizer: true,
          _count: {
            select: {
              tickets: true,
            },
          },
        },
      });

      if (!event) {
        throw new CustomError('Event not found', 404);
      }

      // Check if user has permission to delete this event
      const organizer = await prisma.organizer.findUnique({
        where: { userId },
      });

      if (!organizer || organizer.id !== event.organizerId) {
        throw new CustomError('You can only delete your own events', 403);
      }

      // Check if event has tickets sold
      if (event._count.tickets > 0) {
        throw new CustomError('Cannot delete event with sold tickets. Consider cancelling instead.', 400);
      }

      // Check if event can be deleted (not published or completed)
      if (event.status === EventStatus.PUBLISHED || event.status === EventStatus.COMPLETED) {
        throw new CustomError('Cannot delete published or completed events', 400);
      }

      // Delete event and related data in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete ticket types
        await tx.ticketType.deleteMany({
          where: { eventId: id },
        });

        // Delete the event
        await tx.event.delete({
          where: { id },
        });
      });

      logger.info(`Event deleted successfully: ${id} by user ${userId}`);
    } catch (error: any) {
      logger.error('Failed to delete event:', error);
      throw error;
    }
  }

  /**
   * Publish an event
   */
  static async publishEvent(id: string, userId: string): Promise<EventWithDetails> {
    try {
      const event = await this.getEventById(id);

      // Check if user has permission
      const organizer = await prisma.organizer.findUnique({
        where: { userId },
      });

      if (!organizer || organizer.id !== event.organizerId) {
        throw new CustomError('You can only publish your own events', 403);
      }

      // Check if event can be published
      if (event.status !== EventStatus.DRAFT) {
        throw new CustomError('Only draft events can be published', 400);
      }

      // Validate required fields
      if (!event.venueId) {
        throw new CustomError('Event must have a venue to be published', 400);
      }

      if (!event.ticketTypes || event.ticketTypes.length === 0) {
        throw new CustomError('Event must have ticket types to be published', 400);
      }

      // Update event status
      const updatedEvent = await prisma.event.update({
        where: { id },
        data: { status: EventStatus.PUBLISHED },
      });

      logger.info(`Event published successfully: ${id} by user ${userId}`);

      return this.getEventById(id);
    } catch (error: any) {
      logger.error('Failed to publish event:', error);
      throw error;
    }
  }

  /**
   * Cancel an event
   */
  static async cancelEvent(id: string, userId: string, reason?: string): Promise<EventWithDetails> {
    try {
      const event = await this.getEventById(id);

      // Check if user has permission
      const organizer = await prisma.organizer.findUnique({
        where: { userId },
      });

      if (!organizer || organizer.id !== event.organizerId) {
        throw new CustomError('You can only cancel your own events', 403);
      }

      // Check if event can be cancelled
      if (event.status === EventStatus.COMPLETED || event.status === EventStatus.CANCELLED) {
        throw new CustomError('Event is already completed or cancelled', 400);
      }

      // Update event status
      const updatedEvent = await prisma.event.update({
        where: { id },
        data: { 
          status: EventStatus.CANCELLED,
          // Store cancellation reason in description if provided
          description: reason ? `${event.description}\n\nCancelled: ${reason}` : event.description,
        },
      });

      logger.info(`Event cancelled successfully: ${id} by user ${userId}, reason: ${reason || 'No reason provided'}`);

      return this.getEventById(id);
    } catch (error: any) {
      logger.error('Failed to cancel event:', error);
      throw error;
    }
  }

  /**
   * Get events by organizer
   */
  static async getEventsByOrganizer(organizerId: string, filters: Omit<EventFilters, 'organizerId'> = {}): Promise<{
    events: EventWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getEvents({ ...filters, organizerId });
  }

  /**
   * Get public events (for buyers)
   */
  static async getPublicEvents(filters: Omit<EventFilters, 'isPublic'> = {}): Promise<{
    events: EventWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getEvents({ ...filters, isPublic: true, status: EventStatus.PUBLISHED });
  }

  /**
   * Get event statistics
   */
  static async getEventStats(eventId: string): Promise<{
    totalTickets: number;
    soldTickets: number;
    availableTickets: number;
    totalRevenue: number;
    ticketTypeStats: Array<{
      name: string;
      total: number;
      sold: number;
      available: number;
      revenue: number;
    }>;
  }> {
    try {
      const event = await this.getEventById(eventId);

      const totalTickets = event.capacity;
      const soldTickets = event._count.tickets;
      const availableTickets = totalTickets - soldTickets;

      // Calculate revenue from sold tickets
      const tickets = await prisma.ticket.findMany({
        where: { eventId },
        include: { ticketType: true },
      });

      const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.ticketType.price, 0);

      // Calculate ticket type statistics
      const ticketTypeStats = event.ticketTypes.map(type => ({
        name: type.name,
        total: type.quantity,
        sold: type.sold,
        available: type.quantity - type.sold,
        revenue: type.sold * type.price,
      }));

      return {
        totalTickets,
        soldTickets,
        availableTickets,
        totalRevenue,
        ticketTypeStats,
      };
    } catch (error: any) {
      logger.error('Failed to get event statistics:', error);
      throw error;
    }
  }
}
