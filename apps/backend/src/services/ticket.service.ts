import { Prisma, Ticket, TicketStatus, PaymentStatus } from '@prisma/client';
import prisma from '../config/database.config';
import { logger } from '../utils/logger.util';
import { CustomError } from '../middleware/errorHandler.middleware';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { PaymentService } from './payment.service';

export interface TicketFilters {
  eventId?: string;
  buyerId?: string;
  status?: TicketStatus;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'purchaseDate' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface TicketWithDetails extends Ticket {
  event: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    venue?: {
      name: string;
      location: string;
    };
  };
  buyer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  payment?: {
    id: string;
    status: PaymentStatus;
    amount: number;
    method: string;
  };
}

export interface PurchaseTicketData {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  paymentMethod: string;
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  buyerId: string;
}

export interface PurchaseTicketResult {
  success: boolean;
  tickets: TicketWithDetails[];
  paymentId: string;
  paymentUrl?: string;
  totalAmount: number;
}

export interface ValidateTicketResult {
  isValid: boolean;
  ticket: TicketWithDetails;
  message: string;
  isUsed: boolean;
  isExpired: boolean;
}

export class TicketService {
  /**
   * Get tickets with filtering and pagination
   */
  static async getTickets(filters: TicketFilters): Promise<{
    tickets: TicketWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        eventId,
        buyerId,
        status,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const where: Prisma.TicketWhereInput = {};

      if (eventId) {
        where.eventId = eventId;
      }

      if (buyerId) {
        where.buyerId = buyerId;
      }

      if (status) {
        where.status = status;
      }

      const skip = (page - 1) * limit;
      const take = limit;

      const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
          where,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
          include: {
            event: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
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
                firstName: true,
                lastName: true,
                email: true
              }
            },
            payment: {
              select: {
                id: true,
                status: true,
                amount: true,
                method: true
              }
            }
          }
        }),
        prisma.ticket.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        tickets,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error: any) {
      logger.error('Failed to get tickets:', error);
      throw error;
    }
  }

  /**
   * Get ticket by ID
   */
  static async getTicketById(id: string): Promise<TicketWithDetails> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
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
              firstName: true,
              lastName: true,
              email: true
            }
          },
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              method: true
            }
          }
        }
      });

      if (!ticket) {
        throw new CustomError('Ticket not found', 404);
      }

      return ticket;
    } catch (error: any) {
      logger.error('Failed to get ticket by ID:', error);
      throw error;
    }
  }

  /**
   * Purchase tickets
   */
  static async purchaseTickets(data: PurchaseTicketData): Promise<PurchaseTicketResult> {
    try {
      const { eventId, ticketTypeId, quantity, paymentMethod, customerData, buyerId } = data;

      // Validate event exists and is published
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          ticketTypes: {
            where: { id: ticketTypeId }
          }
        }
      });

      if (!event) {
        throw new CustomError('Event not found', 404);
      }

      if (event.status !== 'PUBLISHED') {
        throw new CustomError('Event is not available for ticket purchase', 400);
      }

      if (event.startDate <= new Date()) {
        throw new CustomError('Event has already started', 400);
      }

      const ticketType = event.ticketTypes[0];
      if (!ticketType) {
        throw new CustomError('Ticket type not found', 404);
      }

      if (ticketType.quantity - ticketType.sold < quantity) {
        throw new CustomError('Not enough tickets available', 400);
      }

      // Create tickets and initiate payment
      const result = await prisma.$transaction(async (tx) => {
        // Create tickets
        const tickets = [];
        for (let i = 0; i < quantity; i++) {
          const qrCode = await this.generateQRCode();
          
          const ticket = await tx.ticket.create({
            data: {
              eventId,
              buyerId,
              qrCode,
              price: ticketType.price,
              currency: 'EGP',
              status: TicketStatus.AVAILABLE,
              purchaseDate: new Date()
            },
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  endDate: true,
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
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          });

          tickets.push(ticket);
        }

        // Update ticket type sold count
        await tx.ticketType.update({
          where: { id: ticketTypeId },
          data: { sold: { increment: quantity } }
        });

        // Calculate total amount
        const totalAmount = ticketType.price * quantity;

        // Initiate payment
        const paymentResult = await PaymentService.initiatePayment({
          eventId,
          ticketTypeId,
          quantity,
          amount: totalAmount,
          currency: 'EGP',
          paymentMethod: paymentMethod as any,
          customerData,
          buyerId
        });

        return {
          tickets,
          paymentId: paymentResult.paymentId,
          paymentUrl: paymentResult.paymentUrl,
          totalAmount
        };
      });

      logger.info(`Tickets purchased successfully: ${quantity} tickets for event ${eventId}`);

      return {
        success: true,
        tickets: result.tickets,
        paymentId: result.paymentId,
        paymentUrl: result.paymentUrl,
        totalAmount: result.totalAmount
      };
    } catch (error: any) {
      logger.error('Failed to purchase tickets:', error);
      throw error;
    }
  }

  /**
   * Validate ticket QR code
   */
  static async validateTicket(qrCode: string, userId: string): Promise<ValidateTicketResult> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { qrCode },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
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
              firstName: true,
              lastName: true,
              email: true
            }
          },
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              method: true
            }
          }
        }
      });

      if (!ticket) {
        return {
          isValid: false,
          ticket: null as any,
          message: 'Invalid QR code',
          isUsed: false,
          isExpired: false
        };
      }

      // Check if ticket is already used
      if (ticket.status === TicketStatus.USED) {
        return {
          isValid: true,
          ticket,
          message: 'Ticket has already been used',
          isUsed: true,
          isExpired: false
        };
      }

      // Check if event has passed
      if (ticket.event.endDate < new Date()) {
        return {
          isValid: true,
          ticket,
          message: 'Event has ended',
          isUsed: false,
          isExpired: true
        };
      }

      // Check if payment is completed
      if (!ticket.payment || ticket.payment.status !== PaymentStatus.COMPLETED) {
        return {
          isValid: false,
          ticket,
          message: 'Payment not completed',
          isUsed: false,
          isExpired: false
        };
      }

      // Log QR scan
      await prisma.qRScan.create({
        data: {
          ticketId: ticket.id,
          qrCode,
          isScanned: true,
          scannedAt: new Date(),
          scannedBy: userId,
          isValid: true
        }
      });

      return {
        isValid: true,
        ticket,
        message: 'Ticket is valid',
        isUsed: false,
        isExpired: false
      };
    } catch (error: any) {
      logger.error('Failed to validate ticket:', error);
      throw error;
    }
  }

  /**
   * Use ticket (mark as used)
   */
  static async useTicket(id: string, userId: string): Promise<TicketWithDetails> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          event: true,
          payment: true
        }
      });

      if (!ticket) {
        throw new CustomError('Ticket not found', 404);
      }

      if (ticket.status === TicketStatus.USED) {
        throw new CustomError('Ticket has already been used', 400);
      }

      if (ticket.status !== TicketStatus.SOLD) {
        throw new CustomError('Ticket is not in sold status', 400);
      }

      if (!ticket.payment || ticket.payment.status !== PaymentStatus.COMPLETED) {
        throw new CustomError('Payment not completed', 400);
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id },
        data: {
          status: TicketStatus.USED,
          usedDate: new Date()
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
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
              firstName: true,
              lastName: true,
              email: true
            }
          },
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              method: true
            }
          }
        }
      });

      logger.info(`Ticket used successfully: ${id} by user ${userId}`);

      return updatedTicket;
    } catch (error: any) {
      logger.error('Failed to use ticket:', error);
      throw error;
    }
  }

  /**
   * Refund ticket
   */
  static async refundTicket(id: string, reason: string, userId: string): Promise<TicketWithDetails> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          event: true,
          payment: true
        }
      });

      if (!ticket) {
        throw new CustomError('Ticket not found', 404);
      }

      if (ticket.status === TicketStatus.REFUNDED) {
        throw new CustomError('Ticket has already been refunded', 400);
      }

      if (ticket.status === TicketStatus.USED) {
        throw new CustomError('Cannot refund used ticket', 400);
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update ticket status
        const updatedTicket = await tx.ticket.update({
          where: { id },
          data: {
            status: TicketStatus.REFUNDED,
            refundReason: reason,
            refundDate: new Date()
          },
          include: {
            event: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
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
                firstName: true,
                lastName: true,
                email: true
              }
            },
            payment: {
              select: {
                id: true,
                status: true,
                amount: true,
                method: true
              }
            }
          }
        });

        // Update ticket type sold count
        await tx.ticketType.updateMany({
          where: {
            eventId: ticket.eventId,
            price: ticket.price
          },
          data: { sold: { decrement: 1 } }
        });

        // Process payment refund if payment exists
        if (ticket.payment) {
          await PaymentService.processRefund(ticket.payment.id, reason, ticket.price, userId);
        }

        return updatedTicket;
      });

      logger.info(`Ticket refunded successfully: ${id} by user ${userId}`);

      return result;
    } catch (error: any) {
      logger.error('Failed to refund ticket:', error);
      throw error;
    }
  }

  /**
   * Transfer ticket to another user
   */
  static async transferTicket(id: string, transferTo: string, userId: string): Promise<TicketWithDetails> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          event: true,
          payment: true
        }
      });

      if (!ticket) {
        throw new CustomError('Ticket not found', 404);
      }

      if (ticket.buyerId !== userId) {
        throw new CustomError('Not authorized to transfer this ticket', 403);
      }

      if (ticket.status !== TicketStatus.SOLD) {
        throw new CustomError('Only sold tickets can be transferred', 400);
      }

      if (!ticket.payment || ticket.payment.status !== PaymentStatus.COMPLETED) {
        throw new CustomError('Payment not completed', 400);
      }

      // Check if transfer email exists
      const newBuyer = await prisma.user.findUnique({
        where: { email: transferTo }
      });

      if (!newBuyer) {
        throw new CustomError('User with this email does not exist', 404);
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id },
        data: {
          buyerId: newBuyer.id,
          transferTo,
          transferDate: new Date()
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
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
              firstName: true,
              lastName: true,
              email: true
            }
          },
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              method: true
            }
          }
        }
      });

      logger.info(`Ticket transferred successfully: ${id} from ${userId} to ${transferTo}`);

      return updatedTicket;
    } catch (error: any) {
      logger.error('Failed to transfer ticket:', error);
      throw error;
    }
  }

  /**
   * Generate QR code for ticket
   */
  private static async generateQRCode(): Promise<string> {
    try {
      const uniqueId = uuidv4();
      const qrCodeData = `TICKET:${uniqueId}:${Date.now()}`;
      
      // Generate QR code as base64 string
      const qrCodeString = await QRCode.toDataURL(qrCodeData);
      
      return qrCodeString;
    } catch (error: any) {
      logger.error('Failed to generate QR code:', error);
      throw new CustomError('Failed to generate QR code', 500);
    }
  }

  /**
   * Get ticket statistics
   */
  static async getTicketStats(eventId?: string): Promise<{
    total: number;
    sold: number;
    used: number;
    refunded: number;
    available: number;
    revenue: number;
  }> {
    try {
      const where: Prisma.TicketWhereInput = {};
      if (eventId) {
        where.eventId = eventId;
      }

      const [total, sold, used, refunded, revenueData] = await Promise.all([
        prisma.ticket.count({ where }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.SOLD } }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.USED } }),
        prisma.ticket.count({ where: { ...where, status: TicketStatus.REFUNDED } }),
        prisma.ticket.aggregate({
          where: { ...where, status: { in: [TicketStatus.SOLD, TicketStatus.USED] } },
          _sum: { price: true }
        })
      ]);

      const available = total - sold - refunded;
      const revenue = revenueData._sum.price || 0;

      return {
        total,
        sold,
        used,
        refunded,
        available,
        revenue
      };
    } catch (error: any) {
      logger.error('Failed to get ticket statistics:', error);
      throw error;
    }
  }
}
