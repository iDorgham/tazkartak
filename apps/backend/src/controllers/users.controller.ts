import { Request, Response, NextFunction } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/api.types';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger.util';
import { CustomError } from '../middleware/errorHandler.middleware';
import { UserRole, UserStatus } from '@prisma/client';
import prisma from '../config/database.config';

export const usersController = {
  /**
   * Get users with filtering and pagination (Admin only)
   */
  getUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        throw new CustomError('Not authorized to view users', 403);
      }

      const {
        search,
        role,
        status,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const where: any = {};

      if (search) {
        where.OR = [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (role) {
        where.role = role as UserRole;
      }

      if (status) {
        where.status = status as UserStatus;
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take,
          orderBy: { [sortBy as string]: sortOrder },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            status: true,
            emailVerified: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.user.count({ where })
      ]);

      const totalPages = Math.ceil(total / take);

      const response: PaginatedResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          pages: totalPages,
          hasNext: parseInt(page as string) < totalPages,
          hasPrev: parseInt(page as string) > 1
        }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('User ID is required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Users can only view their own profile unless they're admin
      if (userRole !== 'ADMIN' && id !== userId) {
        throw new CustomError('Not authorized to view this user', 403);
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          lastLogin: true,
          profileImage: true,
          bio: true,
          company: true,
          website: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new CustomError('User not found', 404);
      }

      const response: ApiResponse = {
        success: true,
        message: 'User retrieved successfully',
        data: user
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update user profile
   */
  updateUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        throw new CustomError('User ID is required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Users can only update their own profile unless they're admin
      if (userRole !== 'ADMIN' && id !== userId) {
        throw new CustomError('Not authorized to update this user', 403);
      }

      // Remove sensitive fields that shouldn't be updated via this endpoint
      const { password, email, role, status, ...allowedUpdates } = updateData;

      const updatedUser = await prisma.user.update({
        where: { id },
        data: allowedUpdates,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          profileImage: true,
          bio: true,
          company: true,
          website: true,
          updatedAt: true
        }
      });

      const response: ApiResponse = {
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete user (Admin only)
   */
  deleteUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('User ID is required', 400);
      }

      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        throw new CustomError('Not authorized to delete users', 403);
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Prevent admin from deleting themselves
      const currentUserId = (req as any).user?.id;
      if (id === currentUserId) {
        throw new CustomError('Cannot delete your own account', 400);
      }

      await prisma.user.delete({
        where: { id }
      });

      const response: ApiResponse = {
        success: true,
        message: 'User deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Activate user (Admin only)
   */
  activateUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('User ID is required', 400);
      }

      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        throw new CustomError('Not authorized to activate users', 403);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { status: UserStatus.ACTIVE },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          updatedAt: true
        }
      });

      const response: ApiResponse = {
        success: true,
        message: 'User activated successfully',
        data: updatedUser
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Suspend user (Admin only)
   */
  suspendUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        throw new CustomError('User ID is required', 400);
      }

      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        throw new CustomError('Not authorized to suspend users', 403);
      }

      // Prevent admin from suspending themselves
      const currentUserId = (req as any).user?.id;
      if (id === currentUserId) {
        throw new CustomError('Cannot suspend your own account', 400);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { status: UserStatus.SUSPENDED },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          updatedAt: true
        }
      });

      // TODO: Log suspension reason
      // TODO: Send notification to user

      const response: ApiResponse = {
        success: true,
        message: 'User suspended successfully',
        data: updatedUser
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Change user role (Admin only)
   */
  changeUserRole: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!id || !role) {
        throw new CustomError('User ID and role are required', 400);
      }

      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        throw new CustomError('Not authorized to change user roles', 403);
      }

      // Prevent admin from changing their own role
      const currentUserId = (req as any).user?.id;
      if (id === currentUserId) {
        throw new CustomError('Cannot change your own role', 400);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role: role as UserRole },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          updatedAt: true
        }
      });

      // TODO: Log role change
      // TODO: Send notification to user

      const response: ApiResponse = {
        success: true,
        message: 'User role changed successfully',
        data: updatedUser
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get user statistics (Admin only)
   */
  getUserStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        throw new CustomError('Not authorized to view user statistics', 403);
      }

      const [
        totalUsers,
        activeUsers,
        suspendedUsers,
        pendingUsers,
        usersByRole
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
        prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
        prisma.user.count({ where: { status: UserStatus.PENDING } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true }
        })
      ]);

      const stats = {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        pending: pendingUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count.role;
          return acc;
        }, {} as Record<string, number>)
      };

      const response: ApiResponse = {
        success: true,
        message: 'User statistics retrieved successfully',
        data: stats
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
};

