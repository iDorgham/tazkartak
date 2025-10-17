import { Prisma, Venue, VenueStatus } from '@prisma/client';
import prisma from '../config/database.config';
import { logger } from '../utils/logger.util';
import { CustomError } from '../middleware/errorHandler.middleware';

export interface CreateVenueData {
  name: string;
  description?: string;
  location: string;
  address: string;
  city: string;
  capacity: number;
  amenities: string[];
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  images?: string[];
  latitude?: number;
  longitude?: number;
  ownerId: string;
}

export interface UpdateVenueData {
  name?: string;
  description?: string;
  location?: string;
  address?: string;
  city?: string;
  capacity?: number;
  amenities?: string[];
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  images?: string[];
  latitude?: number;
  longitude?: number;
  status?: VenueStatus;
}

export interface VenueFilters {
  search?: string;
  city?: string;
  status?: VenueStatus;
  minCapacity?: number;
  maxCapacity?: number;
  amenities?: string[];
  ownerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'capacity' | 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface VenueWithDetails extends Venue {
  owner: {
    id: string;
    name: string;
    contactEmail: string;
  };
  _count: {
    events: number;
  };
  events?: Array<{
    id: string;
    name: string;
    startDate: Date;
    status: string;
  }>;
}

export interface VenueVerificationData {
  isVerified: boolean;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export class VenueService {
  /**
   * Create a new venue
   */
  static async createVenue(data: CreateVenueData): Promise<VenueWithDetails> {
    try {
      // Validate venue owner exists
      const owner = await prisma.venueOwner.findUnique({
        where: { id: data.ownerId },
        include: { user: true }
      });

      if (!owner) {
        throw new CustomError('Venue owner not found', 404);
      }

      // Check if venue with same name and location already exists
      const existingVenue = await prisma.venue.findFirst({
        where: {
          name: data.name,
          location: data.location,
          ownerId: data.ownerId,
        },
      });

      if (existingVenue) {
        throw new CustomError('Venue with this name and location already exists', 400);
      }

      // Create venue
      const venue = await prisma.venue.create({
        data: {
          name: data.name,
          description: data.description,
          location: data.location,
          address: data.address,
          city: data.city,
          capacity: data.capacity,
          amenities: data.amenities,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          website: data.website,
          images: data.images || [],
          latitude: data.latitude,
          longitude: data.longitude,
          ownerId: data.ownerId,
          status: VenueStatus.PENDING_VERIFICATION,
        },
      });

      logger.info(`Venue created successfully: ${venue.id} by owner ${data.ownerId}`);

      // Return venue with details
      return this.getVenueById(venue.id);
    } catch (error: any) {
      logger.error('Failed to create venue:', error);
      throw error;
    }
  }

  /**
   * Get venue by ID with full details
   */
  static async getVenueById(id: string): Promise<VenueWithDetails> {
    try {
      const venue = await prisma.venue.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              contactEmail: true,
            },
          },
          events: {
            select: {
              id: true,
              name: true,
              startDate: true,
              status: true,
            },
            orderBy: {
              startDate: 'desc',
            },
            take: 5, // Get latest 5 events
          },
          _count: {
            select: {
              events: true,
            },
          },
        },
      });

      if (!venue) {
        throw new CustomError('Venue not found', 404);
      }

      return venue as VenueWithDetails;
    } catch (error: any) {
      logger.error('Failed to get venue by ID:', error);
      throw error;
    }
  }

  /**
   * Get venues with filtering and pagination
   */
  static async getVenues(filters: VenueFilters = {}): Promise<{
    venues: VenueWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        search,
        city,
        status,
        minCapacity,
        maxCapacity,
        amenities,
        ownerId,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      // Build where clause
      const where: Prisma.VenueWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (city) {
        where.city = { contains: city, mode: 'insensitive' };
      }

      if (status) {
        where.status = status;
      }

      if (minCapacity || maxCapacity) {
        where.capacity = {};
        if (minCapacity) where.capacity.gte = minCapacity;
        if (maxCapacity) where.capacity.lte = maxCapacity;
      }

      if (amenities && amenities.length > 0) {
        where.amenities = {
          hasSome: amenities,
        };
      }

      if (ownerId) {
        where.ownerId = ownerId;
      }

      // Build orderBy clause
      const orderBy: Prisma.VenueOrderByWithRelationInput = {};
      orderBy[sortBy] = sortOrder;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel
      const [venues, total] = await Promise.all([
        prisma.venue.findMany({
          where,
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                contactEmail: true,
              },
            },
            events: {
              select: {
                id: true,
                name: true,
                startDate: true,
                status: true,
              },
              orderBy: {
                startDate: 'desc',
              },
              take: 5,
            },
            _count: {
              select: {
                events: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.venue.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        venues: venues as VenueWithDetails[],
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error: any) {
      logger.error('Failed to get venues:', error);
      throw error;
    }
  }

  /**
   * Update a venue
   */
  static async updateVenue(id: string, data: UpdateVenueData, userId: string): Promise<VenueWithDetails> {
    try {
      // Get the venue first
      const existingVenue = await prisma.venue.findUnique({
        where: { id },
        include: { owner: true },
      });

      if (!existingVenue) {
        throw new CustomError('Venue not found', 404);
      }

      // Check if user has permission to update this venue
      const venueOwner = await prisma.venueOwner.findUnique({
        where: { userId },
      });

      if (!venueOwner || venueOwner.id !== existingVenue.ownerId) {
        throw new CustomError('You can only update your own venues', 403);
      }

      // If venue is verified, reset status to pending verification when updated
      let updateData = { ...data };
      if (existingVenue.status === VenueStatus.VERIFIED && Object.keys(data).length > 0) {
        updateData.status = VenueStatus.PENDING_VERIFICATION;
        updateData.verifiedBy = null;
        updateData.verifiedAt = null;
        updateData.verificationNotes = null;
      }

      // Update venue
      const venue = await prisma.venue.update({
        where: { id },
        data: updateData,
      });

      logger.info(`Venue updated successfully: ${id} by user ${userId}`);

      return this.getVenueById(id);
    } catch (error: any) {
      logger.error('Failed to update venue:', error);
      throw error;
    }
  }

  /**
   * Delete a venue
   */
  static async deleteVenue(id: string, userId: string): Promise<void> {
    try {
      // Get the venue first
      const venue = await prisma.venue.findUnique({
        where: { id },
        include: { 
          owner: true,
          _count: {
            select: {
              events: true,
            },
          },
        },
      });

      if (!venue) {
        throw new CustomError('Venue not found', 404);
      }

      // Check if user has permission to delete this venue
      const venueOwner = await prisma.venueOwner.findUnique({
        where: { userId },
      });

      if (!venueOwner || venueOwner.id !== venue.ownerId) {
        throw new CustomError('You can only delete your own venues', 403);
      }

      // Check if venue has events
      if (venue._count.events > 0) {
        throw new CustomError('Cannot delete venue with associated events. Please cancel or complete all events first.', 400);
      }

      // Delete venue
      await prisma.venue.delete({
        where: { id },
      });

      logger.info(`Venue deleted successfully: ${id} by user ${userId}`);
    } catch (error: any) {
      logger.error('Failed to delete venue:', error);
      throw error;
    }
  }

  /**
   * Verify a venue (Admin only)
   */
  static async verifyVenue(id: string, verificationData: VenueVerificationData, adminUserId: string): Promise<VenueWithDetails> {
    try {
      const venue = await prisma.venue.findUnique({
        where: { id },
      });

      if (!venue) {
        throw new CustomError('Venue not found', 404);
      }

      // Update venue verification status
      const updateData: any = {
        isVerified: verificationData.isVerified,
        verificationNotes: verificationData.verificationNotes,
        verifiedBy: adminUserId,
        verifiedAt: new Date(),
      };

      // Set status based on verification result
      if (verificationData.isVerified) {
        updateData.status = VenueStatus.VERIFIED;
      } else {
        updateData.status = VenueStatus.REJECTED;
      }

      const updatedVenue = await prisma.venue.update({
        where: { id },
        data: updateData,
      });

      logger.info(`Venue verification updated: ${id} by admin ${adminUserId}, verified: ${verificationData.isVerified}`);

      return this.getVenueById(id);
    } catch (error: any) {
      logger.error('Failed to verify venue:', error);
      throw error;
    }
  }

  /**
   * Get venues by owner
   */
  static async getVenuesByOwner(ownerId: string, filters: Omit<VenueFilters, 'ownerId'> = {}): Promise<{
    venues: VenueWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getVenues({ ...filters, ownerId });
  }

  /**
   * Get verified venues (for organizers to select)
   */
  static async getVerifiedVenues(filters: Omit<VenueFilters, 'status'> = {}): Promise<{
    venues: VenueWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getVenues({ ...filters, status: VenueStatus.VERIFIED });
  }

  /**
   * Get venues pending verification (for admin)
   */
  static async getPendingVerificationVenues(filters: Omit<VenueFilters, 'status'> = {}): Promise<{
    venues: VenueWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getVenues({ ...filters, status: VenueStatus.PENDING_VERIFICATION });
  }

  /**
   * Search venues by location
   */
  static async searchVenuesByLocation(query: string, limit: number = 10): Promise<VenueWithDetails[]> {
    try {
      const venues = await prisma.venue.findMany({
        where: {
          AND: [
            { status: VenueStatus.VERIFIED },
            {
              OR: [
                { city: { contains: query, mode: 'insensitive' } },
                { location: { contains: query, mode: 'insensitive' } },
                { address: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              contactEmail: true,
            },
          },
          _count: {
            select: {
              events: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return venues as VenueWithDetails[];
    } catch (error: any) {
      logger.error('Failed to search venues by location:', error);
      throw error;
    }
  }

  /**
   * Get venue statistics
   */
  static async getVenueStats(venueId: string): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    pastEvents: number;
    totalRevenue: number;
    averageAttendance: number;
    occupancyRate: number;
  }> {
    try {
      const venue = await this.getVenueById(venueId);

      // Get all events for this venue
      const events = await prisma.event.findMany({
        where: { venueId },
        include: {
          tickets: {
            include: {
              ticketType: true,
            },
          },
        },
      });

      const now = new Date();
      const upcomingEvents = events.filter(event => new Date(event.startDate) > now).length;
      const pastEvents = events.filter(event => new Date(event.startDate) <= now).length;

      // Calculate revenue and attendance
      let totalRevenue = 0;
      let totalAttendance = 0;
      let totalCapacity = 0;

      events.forEach(event => {
        const eventRevenue = event.tickets.reduce((sum, ticket) => sum + ticket.ticketType.price, 0);
        totalRevenue += eventRevenue;
        totalAttendance += event.tickets.length;
        totalCapacity += event.capacity;
      });

      const averageAttendance = events.length > 0 ? totalAttendance / events.length : 0;
      const occupancyRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;

      return {
        totalEvents: events.length,
        upcomingEvents,
        pastEvents,
        totalRevenue,
        averageAttendance: Math.round(averageAttendance),
        occupancyRate: Math.round(occupancyRate * 100) / 100,
      };
    } catch (error: any) {
      logger.error('Failed to get venue statistics:', error);
      throw error;
    }
  }

  /**
   * Get available amenities list
   */
  static async getAvailableAmenities(): Promise<string[]> {
    try {
      // Get all unique amenities from all venues
      const venues = await prisma.venue.findMany({
        select: {
          amenities: true,
        },
        where: {
          status: VenueStatus.VERIFIED,
        },
      });

      const allAmenities = venues.flatMap(venue => venue.amenities);
      const uniqueAmenities = [...new Set(allAmenities)].sort();

      return uniqueAmenities;
    } catch (error: any) {
      logger.error('Failed to get available amenities:', error);
      throw error;
    }
  }

  /**
   * Get cities with venues
   */
  static async getCitiesWithVenues(): Promise<string[]> {
    try {
      const cities = await prisma.venue.findMany({
        select: {
          city: true,
        },
        where: {
          status: VenueStatus.VERIFIED,
        },
        distinct: ['city'],
        orderBy: {
          city: 'asc',
        },
      });

      return cities.map(city => city.city);
    } catch (error: any) {
      logger.error('Failed to get cities with venues:', error);
      throw error;
    }
  }
}
