import { PrismaClient, Event, EventStatus, EventCategory } from '@prisma/client';

const prisma = new PrismaClient();

export class EventModel {
  static async create(data: {
    name: string;
    description: string;
    category: EventCategory;
    startDate: Date;
    endDate: Date;
    capacity: number;
    price: number;
    currency?: string;
    imageUrl?: string;
    isPublic?: boolean;
    organizerId: string;
    venueId: string;
  }): Promise<Event> {
    return prisma.event.create({
      data: {
        ...data,
        currency: data.currency || 'EGP',
        isPublic: data.isPublic ?? true,
        status: EventStatus.DRAFT,
      },
    });
  }

  static async findById(id: string): Promise<Event | null> {
    return prisma.event.findUnique({
      where: { id },
      include: {
        organizer: true,
        venue: true,
        tickets: true,
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });
  }

  static async findByOrganizer(organizerId: string, filters?: {
    status?: EventStatus;
    page?: number;
    limit?: number;
  }): Promise<{ events: Event[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      organizerId,
      ...(filters?.status && { status: filters.status }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          venue: true,
          _count: {
            select: {
              tickets: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total };
  }

  static async getAll(filters?: {
    category?: EventCategory;
    status?: EventStatus;
    dateFrom?: Date;
    dateTo?: Date;
    priceMin?: number;
    priceMax?: number;
    location?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ events: Event[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      isPublic: true,
      ...(filters?.category && { category: filters.category }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priceMin && { price: { gte: filters.priceMin } }),
      ...(filters?.priceMax && { price: { lte: filters.priceMax } }),
    };

    if (filters?.dateFrom || filters?.dateTo) {
      where.startDate = {};
      if (filters.dateFrom) where.startDate.gte = filters.dateFrom;
      if (filters.dateTo) where.startDate.lte = filters.dateTo;
    }

    if (filters?.location) {
      where.venue = {
        OR: [
          { city: { contains: filters.location, mode: 'insensitive' } },
          { address: { contains: filters.location, mode: 'insensitive' } },
        ],
      };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'asc' },
        include: {
          organizer: {
            select: {
              firstName: true,
              lastName: true,
              company: true,
            },
          },
          venue: {
            select: {
              name: true,
              address: true,
              city: true,
            },
          },
          _count: {
            select: {
              tickets: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total };
  }

  static async update(id: string, data: Partial<Event>): Promise<Event> {
    return prisma.event.update({
      where: { id },
      data,
    });
  }

  static async updateStatus(id: string, status: EventStatus): Promise<Event> {
    return prisma.event.update({
      where: { id },
      data: { status },
    });
  }

  static async delete(id: string): Promise<Event> {
    return prisma.event.delete({
      where: { id },
    });
  }

  static async getEventStats(id: string): Promise<{
    totalTickets: number;
    soldTickets: number;
    availableTickets: number;
    revenue: number;
    attendance: number;
  }> {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        tickets: {
          select: {
            status: true,
            price: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const totalTickets = event.capacity;
    const soldTickets = event.tickets.filter(t => t.status === 'SOLD').length;
    const usedTickets = event.tickets.filter(t => t.status === 'USED').length;
    const revenue = event.tickets
      .filter(t => t.status === 'SOLD' || t.status === 'USED')
      .reduce((sum, ticket) => sum + ticket.price, 0);

    return {
      totalTickets,
      soldTickets,
      availableTickets: totalTickets - soldTickets,
      revenue,
      attendance: usedTickets,
    };
  }

  static async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    return prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        startDate: {
          gte: new Date(),
        },
      },
      take: limit,
      orderBy: { startDate: 'asc' },
      include: {
        venue: {
          select: {
            name: true,
            address: true,
            city: true,
          },
        },
        organizer: {
          select: {
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
    });
  }
}
