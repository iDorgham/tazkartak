import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class UserModel {
  static async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    return prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: data.role || UserRole.BUYER,
        status: UserStatus.PENDING,
      },
    });
  }

  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  static async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }

  static async getAll(filters?: {
    role?: UserRole;
    status?: UserStatus;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      ...(filters?.role && { role: filters.role }),
      ...(filters?.status && { status: filters.status }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  static async updatePassword(id: string, newPassword: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    return prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  static async updateLastLogin(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  static async verifyEmail(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { 
        emailVerified: true,
        status: UserStatus.ACTIVE,
      },
    });
  }

  static async setPasswordResetToken(email: string, token: string, expires: Date): Promise<User> {
    return prisma.user.update({
      where: { email },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });
  }

  static async clearPasswordResetToken(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }
}
