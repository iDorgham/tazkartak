import { PrismaClient, Venue } from '@prisma/client';

const prisma = new PrismaClient();

export class VenueModel {
  static async create(data: {
    name: string;
    description?: string;
    address: string;
    city: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    capacity: number;
    amenities?: string[];
    images?: string[];
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
    website?: string;
    ownerId: string;
  }): Promise<Venue> {
    return prisma.venue.create({
      data: {
        ...data,
        country: data.country || 'Egypt',
        amenities: data.amenities || [],
        images: data.images || [],
      },
    });
  }

  static async findById(id: string): Promise<Venue | null> {
    return prisma.venue.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
          },
        },
        events: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
    });
  }

  static async findByOwner(ownerId: string, filters?: {
    isVerified?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ venues: Venue[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      ownerId,
      ...(filters?.isVerified !== undefined && { isVerified: filters.isVerified }),
    };

    const [venues, total] = await Promise.all([
      prisma.venue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              events: true,
            },
          },
        },
      }),
      prisma.venue.count({ where }),
    ]);

    return { venues, total };
  }

  static async getAll(filters?: {
    city?: string;
    capacityMin?: number;
    capacityMax?: number;
    isVerified?: boolean;
    amenities?: string[];
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ venues: Venue[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(filters?.city && { city: { contains: filters.city, mode: 'insensitive' } }),
      ...(filters?.capacityMin && { capacity: { gte: filters.capacityMin } }),
      ...(filters?.capacityMax && { capacity: { lte: filters.capacityMax } }),
      ...(filters?.isVerified !== undefined && { isVerified: filters.isVerified }),
    };

    if (filters?.amenities && filters.amenities.length > 0) {
      where.amenities = {
        hasSome: filters.amenities,
      };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [venues, total] = await Promise.all([
      prisma.venue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              firstName: true,
              lastName: true,
              company: true,
            },
          },
          _count: {
            select: {
              events: true,
            },
          },
        },
      }),
      prisma.venue.count({ where }),
    ]);

    return { venues, total };
  }

  static async update(id: string, data: Partial<Venue>): Promise<Venue> {
    return prisma.venue.update({
      where: { id },
      data,
    });
  }

  static async verify(id: string, notes?: string): Promise<Venue> {
    return prisma.venue.update({
      where: { id },
      data: {
        isVerified: true,
        verificationNotes: notes,
      },
    });
  }

  static async unverify(id: string, notes?: string): Promise<Venue> {
    return prisma.venue.update({
      where: { id },
      data: {
        isVerified: false,
        verificationNotes: notes,
      },
    });
  }

  static async delete(id: string): Promise<Venue> {
    return prisma.venue.delete({
      where: { id },
    });
  }

  static async getVenueStats(id: string): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    pastEvents: number;
    totalCapacity: number;
    averageAttendance: number;
  }> {
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        events: {
          include: {
            tickets: {
              where: {
                status: 'USED',
              },
            },
          },
        },
      },
    });

    if (!venue) {
      throw new Error('Venue not found');
    }

    const now = new Date();
    const totalEvents = venue.events.length;
    const upcomingEvents = venue.events.filter(e => e.startDate > now).length;
    const pastEvents = venue.events.filter(e => e.endDate < now).length;
    
    const totalCapacity = venue.events.reduce((sum, event) => sum + event.capacity, 0);
    const totalAttendance = venue.events.reduce((sum, event) => sum + event.tickets.length, 0);
    const averageAttendance = totalEvents > 0 ? totalAttendance / totalEvents : 0;

    return {
      totalEvents,
      upcomingEvents,
      pastEvents,
      totalCapacity,
      averageAttendance,
    };
  }

  static async getPopularVenues(limit: number = 10): Promise<Venue[]> {
    return prisma.venue.findMany({
      where: {
        isVerified: true,
        events: {
          some: {
            status: 'PUBLISHED',
          },
        },
      },
      take: limit,
      orderBy: {
        events: {
          _count: 'desc',
        },
      },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            company: true,
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
    });
  }

  static async searchNearby(latitude: number, longitude: number, radiusKm: number = 10): Promise<Venue[]> {
    // This is a simplified implementation
    // In production, you'd use PostGIS for proper geographic queries
    const venues = await prisma.venue.findMany({
      where: {
        isVerified: true,
        latitude: {
          not: null,
        },
        longitude: {
          not: null,
        },
      },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
    });

    // Filter by distance (simplified calculation)
    const nearbyVenues = venues.filter(venue => {
      if (!venue.latitude || !venue.longitude) return false;
      
      const distance = this.calculateDistance(
        latitude, longitude,
        venue.latitude, venue.longitude
      );
      
      return distance <= radiusKm;
    });

    return nearbyVenues;
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
