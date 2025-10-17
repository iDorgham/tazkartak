import { Request, Response, NextFunction } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/api.types';
import { SubscriptionService, SubscriptionCreateData } from '../services/subscription.service';
import { logger } from '../utils/logger.util';
import { CustomError } from '../middleware/errorHandler.middleware';

export const subscriptionsController = {
  /**
   * Get subscriptions with filtering and pagination
   */
  getSubscriptions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        status,
        plan,
        userId,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // If not admin, only show user's own subscriptions
      let filters: any = {
        status: status as string,
        plan: plan as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      if (userRole !== 'ADMIN') {
        filters.userId = currentUserId;
      } else if (userId) {
        filters.userId = userId as string;
      }

      const result = await SubscriptionService.getSubscriptions(filters);

      const response: PaginatedResponse = {
        success: true,
        message: 'Subscriptions retrieved successfully',
        data: result.subscriptions,
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
   * Get subscription by ID
   */
  getSubscriptionById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('Subscription ID is required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const subscription = await SubscriptionService.getSubscriptionById(id);

      // Check if user can access this subscription
      if (userRole !== 'ADMIN' && subscription.userId !== userId) {
        throw new CustomError('Not authorized to view this subscription', 403);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Subscription retrieved successfully',
        data: subscription
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Subscribe to a plan
   */
  subscribe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        plan,
        paymentMethod,
        customerData
      } = req.body;

      const userId = (req as any).user?.id;
      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      if (!plan || !paymentMethod || !customerData) {
        throw new CustomError('Missing required fields', 400);
      }

      const subscriptionData: SubscriptionCreateData = {
        userId,
        plan,
        paymentMethod,
        customerData
      };

      const result = await SubscriptionService.createSubscription(subscriptionData);

      const response: ApiResponse = {
        success: true,
        message: 'Subscription created successfully',
        data: result
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Upgrade subscription
   */
  upgradeSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { newPlan, paymentMethod } = req.body;

      if (!id || !newPlan) {
        throw new CustomError('Subscription ID and new plan are required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Check if user can upgrade this subscription
      const subscription = await SubscriptionService.getSubscriptionById(id);
      
      if (userRole !== 'ADMIN' && subscription.userId !== userId) {
        throw new CustomError('Not authorized to upgrade this subscription', 403);
      }

      const result = await SubscriptionService.upgradeSubscription(id, newPlan, paymentMethod);

      const response: ApiResponse = {
        success: true,
        message: 'Subscription upgraded successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Downgrade subscription
   */
  downgradeSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { newPlan } = req.body;

      if (!id || !newPlan) {
        throw new CustomError('Subscription ID and new plan are required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Check if user can downgrade this subscription
      const subscription = await SubscriptionService.getSubscriptionById(id);
      
      if (userRole !== 'ADMIN' && subscription.userId !== userId) {
        throw new CustomError('Not authorized to downgrade this subscription', 403);
      }

      const result = await SubscriptionService.downgradeSubscription(id, newPlan);

      const response: ApiResponse = {
        success: true,
        message: 'Subscription downgraded successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        throw new CustomError('Subscription ID is required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Check if user can cancel this subscription
      const subscription = await SubscriptionService.getSubscriptionById(id);
      
      if (userRole !== 'ADMIN' && subscription.userId !== userId) {
        throw new CustomError('Not authorized to cancel this subscription', 403);
      }

      const result = await SubscriptionService.cancelSubscription(id, reason);

      const response: ApiResponse = {
        success: true,
        message: 'Subscription cancelled successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get usage statistics
   */
  getUsageStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { month, year } = req.query;

      if (!id) {
        throw new CustomError('Subscription ID is required', 400);
      }

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Check if user can view this subscription's usage
      const subscription = await SubscriptionService.getSubscriptionById(id);
      
      if (userRole !== 'ADMIN' && subscription.userId !== userId) {
        throw new CustomError('Not authorized to view this subscription usage', 403);
      }

      const stats = await SubscriptionService.getUsageStats(
        id,
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined
      );

      const response: ApiResponse = {
        success: true,
        message: 'Usage statistics retrieved successfully',
        data: stats
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get available subscription plans
   */
  getSubscriptionPlans: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await SubscriptionService.getAvailablePlans();

      const response: ApiResponse = {
        success: true,
        message: 'Subscription plans retrieved successfully',
        data: plans
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current user's subscription
   */
  getCurrentSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new CustomError('User not authenticated', 401);
      }

      const subscription = await SubscriptionService.getCurrentSubscription(userId);

      const response: ApiResponse = {
        success: true,
        message: 'Current subscription retrieved successfully',
        data: subscription
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
};

