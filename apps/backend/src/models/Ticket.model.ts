import { PrismaClient, Ticket, TicketStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class TicketModel {
  static async create(data: {
    eventId: string;
    price: number;
    currency?: string;
  }): Promise<Ticket> {
    const qrCode = this.generateQRCode();
    
    return prisma.ticket.create({
      data: {
        ...data,
        currency: data.currency || 'EGP',
        qrCode,
        status: TicketStatus.AVAILABLE,
      },
    });
  }

  static async createMultiple(data: {
    eventId: string;
    price: number;
    currency?: string;
    quantity: number;
  }): Promise<Ticket[]> {
    const tickets = [];
    
    for (let i = 0; i < data.quantity; i++) {
      const qrCode = this.generateQRCode();
      tickets.push({
        eventId: data.eventId,
        price: data.price,
        currency: data.currency || 'EGP',
        qrCode,
        status: TicketStatus.AVAILABLE,
      });
    }
    
    return prisma.ticket.createMany({
      data: tickets,
    }).then(() => {
      return prisma.ticket.findMany({
        where: {
          eventId: data.eventId,
          status: TicketStatus.AVAILABLE,
        },
        orderBy: { createdAt: 'desc' },
        take: data.quantity,
      });
    });
  }

  static async findById(id: string): Promise<Ticket | null> {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            organizer: true,
            venue: true,
          },
        },
        buyer: true,
        payment: true,
        qrScans: true,
      },
    });
  }

  static async findByQRCode(qrCode: string): Promise<Ticket | null> {
    return prisma.ticket.findUnique({
      where: { qrCode },
      include: {
        event: {
          include: {
            organizer: true,
            venue: true,
          },
        },
        buyer: true,
        payment: true,
        qrScans: {
          orderBy: { scannedAt: 'desc' },
        },
      },
    });
  }

  static async findByEvent(eventId: string, filters?: {
    status?: TicketStatus;
    buyerId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tickets: Ticket[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      eventId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.buyerId && { buyerId: filters.buyerId }),
    };

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          payment: true,
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return { tickets, total };
  }

  static async purchase(data: {
    eventId: string;
    buyerId: string;
    quantity: number;
    price: number;
    currency?: string;
  }): Promise<Ticket[]> {
    // Get available tickets for the event
    const availableTickets = await prisma.ticket.findMany({
      where: {
        eventId: data.eventId,
        status: TicketStatus.AVAILABLE,
      },
      take: data.quantity,
    });

    if (availableTickets.length < data.quantity) {
      throw new Error(`Not enough tickets available. Requested: ${data.quantity}, Available: ${availableTickets.length}`);
    }

    // Update tickets to sold status
    const ticketIds = availableTickets.map(ticket => ticket.id);
    
    const updatedTickets = await prisma.ticket.updateMany({
      where: {
        id: {
          in: ticketIds,
        },
      },
      data: {
        status: TicketStatus.SOLD,
        buyerId: data.buyerId,
        purchaseDate: new Date(),
      },
    });

    // Return updated tickets
    return prisma.ticket.findMany({
      where: {
        id: {
          in: ticketIds,
        },
      },
      include: {
        event: true,
        buyer: true,
      },
    });
  }

  static async validateQRCode(qrCode: string): Promise<{
    valid: boolean;
    ticket?: Ticket;
    message: string;
  }> {
    const ticket = await this.findByQRCode(qrCode);
    
    if (!ticket) {
      return {
        valid: false,
        message: 'Invalid QR code',
      };
    }

    if (ticket.status !== TicketStatus.SOLD) {
      return {
        valid: false,
        ticket,
        message: 'Ticket not sold',
      };
    }

    if (ticket.status === TicketStatus.USED) {
      return {
        valid: false,
        ticket,
        message: 'Ticket already used',
      };
    }

    if (ticket.event.endDate < new Date()) {
      return {
        valid: false,
        ticket,
        message: 'Event has ended',
      };
    }

    return {
      valid: true,
      ticket,
      message: 'Ticket is valid',
    };
  }

  static async useTicket(ticketId: string, scannedBy?: string): Promise<Ticket> {
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.USED,
        usedDate: new Date(),
      },
    });

    // Log QR scan
    if (scannedBy) {
      await prisma.qRScan.create({
        data: {
          ticketId,
          scannedBy,
          isValid: true,
        },
      });
    }

    return ticket;
  }

  static async refundTicket(ticketId: string, reason?: string): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.REFUNDED,
        refundDate: new Date(),
        refundReason: reason,
      },
    });
  }

  static async transferTicket(ticketId: string, newBuyerId: string): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id: ticketId },
      data: {
        buyerId: newBuyerId,
        transferDate: new Date(),
      },
    });
  }

  static async getAvailableTicketsCount(eventId: string): Promise<number> {
    return prisma.ticket.count({
      where: {
        eventId,
        status: TicketStatus.AVAILABLE,
      },
    });
  }

  static async getSoldTicketsCount(eventId: string): Promise<number> {
    return prisma.ticket.count({
      where: {
        eventId,
        status: TicketStatus.SOLD,
      },
    });
  }

  static async getUsedTicketsCount(eventId: string): Promise<number> {
    return prisma.ticket.count({
      where: {
        eventId,
        status: TicketStatus.USED,
      },
    });
  }

  private static generateQRCode(): string {
    // Generate a unique QR code using UUID and timestamp
    const timestamp = Date.now().toString(36);
    const uuid = uuidv4().replace(/-/g, '').substring(0, 16);
    return `TK-${timestamp}-${uuid}`.toUpperCase();
  }
}
