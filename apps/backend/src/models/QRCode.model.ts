import { PrismaClient, QRScan } from '@prisma/client';

const prisma = new PrismaClient();

export class QRCodeModel {
  static async createScan(data: {
    ticketId: string;
    scannedBy?: string;
    location?: string;
    device?: string;
    ipAddress?: string;
    isValid?: boolean;
    reason?: string;
  }): Promise<QRScan> {
    return prisma.qRScan.create({
      data: {
        ...data,
        isValid: data.isValid ?? true,
      },
    });
  }

  static async getScansByTicket(ticketId: string): Promise<QRScan[]> {
    return prisma.qRScan.findMany({
      where: { ticketId },
      orderBy: { scannedAt: 'desc' },
    });
  }

  static async getScansByEvent(eventId: string, filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    isValid?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ scans: QRScan[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      ticket: {
        eventId,
      },
      ...(filters?.isValid !== undefined && { isValid: filters.isValid }),
    };

    if (filters?.dateFrom || filters?.dateTo) {
      where.scannedAt = {};
      if (filters.dateFrom) where.scannedAt.gte = filters.dateFrom;
      if (filters.dateTo) where.scannedAt.lte = filters.dateTo;
    }

    const [scans, total] = await Promise.all([
      prisma.qRScan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scannedAt: 'desc' },
        include: {
          ticket: {
            include: {
              event: {
                select: {
                  name: true,
                  startDate: true,
                },
              },
              buyer: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.qRScan.count({ where }),
    ]);

    return { scans, total };
  }

  static async getScanStats(eventId: string): Promise<{
    totalScans: number;
    validScans: number;
    invalidScans: number;
    uniqueScans: number;
    scanRate: number;
  }> {
    const [totalScans, validScans, invalidScans] = await Promise.all([
      prisma.qRScan.count({
        where: {
          ticket: {
            eventId,
          },
        },
      }),
      prisma.qRScan.count({
        where: {
          ticket: {
            eventId,
          },
          isValid: true,
        },
      }),
      prisma.qRScan.count({
        where: {
          ticket: {
            eventId,
          },
          isValid: false,
        },
      }),
    ]);

    const uniqueScans = await prisma.qRScan.groupBy({
      by: ['ticketId'],
      where: {
        ticket: {
          eventId,
        },
        isValid: true,
      },
    });

    const totalTickets = await prisma.ticket.count({
      where: {
        eventId,
        status: {
          in: ['SOLD', 'USED'],
        },
      },
    });

    const scanRate = totalTickets > 0 ? (validScans / totalTickets) * 100 : 0;

    return {
      totalScans,
      validScans,
      invalidScans,
      uniqueScans: uniqueScans.length,
      scanRate,
    };
  }

  static async getRecentScans(limit: number = 50): Promise<QRScan[]> {
    return prisma.qRScan.findMany({
      take: limit,
      orderBy: { scannedAt: 'desc' },
      include: {
        ticket: {
          include: {
            event: {
              select: {
                name: true,
                startDate: true,
              },
            },
            buyer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  static async getScanAnalytics(dateFrom: Date, dateTo: Date): Promise<Array<{
    date: string;
    scans: number;
    validScans: number;
    invalidScans: number;
  }>> {
    const scans = await prisma.qRScan.findMany({
      where: {
        scannedAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      select: {
        scannedAt: true,
        isValid: true,
      },
    });

    const dailyStats: { [key: string]: { scans: number; validScans: number; invalidScans: number } } = {};

    scans.forEach(scan => {
      const date = scan.scannedAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { scans: 0, validScans: 0, invalidScans: 0 };
      }
      dailyStats[date].scans++;
      if (scan.isValid) {
        dailyStats[date].validScans++;
      } else {
        dailyStats[date].invalidScans++;
      }
    });

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
    }));
  }

  static async getPopularScanLocations(limit: number = 10): Promise<Array<{
    location: string;
    scanCount: number;
  }>> {
    const locations = await prisma.qRScan.groupBy({
      by: ['location'],
      where: {
        location: {
          not: null,
        },
        isValid: true,
      },
      _count: true,
      orderBy: {
        _count: {
          location: 'desc',
        },
      },
      take: limit,
    });

    return locations.map(location => ({
      location: location.location || 'Unknown',
      scanCount: location._count,
    }));
  }

  static async getScanDevices(): Promise<Array<{
    device: string;
    scanCount: number;
  }>> {
    const devices = await prisma.qRScan.groupBy({
      by: ['device'],
      where: {
        device: {
          not: null,
        },
        isValid: true,
      },
      _count: true,
      orderBy: {
        _count: {
          device: 'desc',
        },
      },
    });

    return devices.map(device => ({
      device: device.device || 'Unknown',
      scanCount: device._count,
    }));
  }
}

