import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/app.config';
import { prisma } from '../config/database.config';
import { CustomError } from './errorHandler.middleware';
import { AuthService } from '../services/auth.service';
import { UserRole } from '@prisma/client';
import { logger } from '../utils/logger.util';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    organizerId?: string;
    venueId?: string;
  };
}

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies (alternative)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new CustomError('Access denied. No token provided.', 401);
    }

    try {
      // Verify token
      const decoded = await AuthService.verifyToken(token);
      
      // Get user with role-specific data
      const user = await AuthService.getUserById(decoded.userId);
      
      if (!user) {
        throw new CustomError('Token is valid but user no longer exists.', 401);
      }

      if (!user.isActive) {
        throw new CustomError('Account is deactivated. Please contact support.', 401);
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        organizerId: user.organizer?.id,
        venueId: user.venueOwner?.id,
      };

      next();
    } catch (tokenError: any) {
      logger.error('Token verification failed:', tokenError);
      
      if (tokenError.name === 'TokenExpiredError') {
        throw new CustomError('Token has expired. Please login again.', 401);
      } else if (tokenError.name === 'JsonWebTokenError') {
        throw new CustomError('Invalid token. Please login again.', 401);
      } else {
        throw new CustomError('Token verification failed.', 401);
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy auth middleware (for backward compatibility)
 */
export const authMiddleware = protect;

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required.', 401);
      }

      if (!roles.includes(req.user.role)) {
        logger.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role} to route requiring roles: ${roles.join(', ')}`);
        throw new CustomError(`Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Legacy role middleware (for backward compatibility)
 */
export const requireRole = (roles: string[]) => {
  return authorize(...(roles as UserRole[]));
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = await AuthService.verifyToken(token);
        const user = await AuthService.getUserById(decoded.userId);
        
        if (user && user.isActive) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            organizerId: user.organizer?.id,
            venueId: user.venueOwner?.id,
          };
        }
      } catch (error) {
        // Silently ignore token errors for optional auth
        logger.debug('Optional auth token verification failed:', error);
      }
    }

    next();
  } catch (error) {
    next(); // Continue even if there's an error
  }
};

/**
 * Check if user owns the resource
 */
export const checkOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required.', 401);
      }

      // Admin can access everything
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      // Check if user owns the resource
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      if (!resourceUserId) {
        throw new CustomError(`Resource ${resourceUserIdField} not found in request.`, 400);
      }

      if (resourceUserId !== req.user.id) {
        throw new CustomError('Access denied. You can only access your own resources.', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user is organizer and owns the organizer resource
 */
export const checkOrganizerOwnership = () => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required.', 401);
      }

      // Admin can access everything
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      // Must be an organizer
      if (req.user.role !== UserRole.ORGANIZER) {
        throw new CustomError('Access denied. Organizer role required.', 403);
      }

      // Check if organizer owns the resource
      const organizerId = req.params.organizerId || req.body.organizerId;
      
      if (organizerId && organizerId !== req.user.organizerId) {
        throw new CustomError('Access denied. You can only access your own organizer resources.', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user is venue owner and owns the venue resource
 */
export const checkVenueOwnership = () => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required.', 401);
      }

      // Admin can access everything
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      // Must be a venue owner
      if (req.user.role !== UserRole.VENUE_OWNER) {
        throw new CustomError('Access denied. Venue owner role required.', 403);
      }

      // Check if venue owner owns the resource
      const venueId = req.params.venueId || req.body.venueId;
      
      if (venueId && venueId !== req.user.venueId) {
        throw new CustomError('Access denied. You can only access your own venue resources.', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check subscription limits and features
 */
export const checkSubscription = (feature: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required.', 401);
      }

      // Admin bypasses all subscription checks
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      // Get user with subscription
      const user = await AuthService.getUserById(req.user.id);
      if (!user) {
        throw new CustomError('User not found.', 404);
      }

      // Check if user has active subscription
      if (!user.subscription || user.subscription.status !== 'ACTIVE') {
        throw new CustomError('Active subscription required for this feature.', 403);
      }

      // Check feature limits based on subscription plan
      const plan = user.subscription.plan;
      const limits = {
        BASIC: { events: 5, attendees: 1000 },
        PRO: { events: 20, attendees: 5000 },
        ENTERPRISE: { events: -1, attendees: -1 }, // Unlimited
      };

      // Implement feature-specific checks here
      if (feature === 'create_event') {
        if (plan === 'BASIC' || plan === 'PRO') {
          // Check event count for current month
          const currentMonth = new Date();
          currentMonth.setDate(1);
          const eventCount = await prisma.event.count({
            where: {
              organizerId: user.organizer?.id,
              createdAt: { gte: currentMonth },
            },
          });

          const limit = limits[plan as keyof typeof limits]?.events;
          if (limit !== -1 && eventCount >= limit) {
            throw new CustomError(`Event limit reached for ${plan} plan (${limit} events/month). Upgrade your plan to create more events.`, 403);
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limiting based on user role and subscription
 */
export const roleBasedRateLimit = (requests: number, windowMs: number) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        return next();
      }

      // Different rate limits based on role and subscription
      const rateLimits = {
        ADMIN: { requests: requests * 5, windowMs },
        ORGANIZER: { requests: requests * 3, windowMs },
        VENUE_OWNER: { requests: requests * 2, windowMs },
        BUYER: { requests: requests, windowMs },
      };

      const userLimit = rateLimits[req.user.role] || rateLimits.BUYER;
      
      // Store rate limit info in request for use by rate limiting middleware
      (req as any).rateLimit = userLimit;
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user can access specific resource type
 */
export const checkResourceAccess = (resourceType: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required.', 401);
      }

      const role = req.user.role;
      const resourcePermissions = {
        events: [UserRole.ADMIN, UserRole.ORGANIZER],
        venues: [UserRole.ADMIN, UserRole.VENUE_OWNER],
        tickets: [UserRole.ADMIN, UserRole.ORGANIZER, UserRole.BUYER],
        payments: [UserRole.ADMIN, UserRole.ORGANIZER],
        users: [UserRole.ADMIN],
        subscriptions: [UserRole.ADMIN, UserRole.ORGANIZER],
        analytics: [UserRole.ADMIN, UserRole.ORGANIZER],
      };

      const allowedRoles = resourcePermissions[resourceType as keyof typeof resourcePermissions];
      if (!allowedRoles || !allowedRoles.includes(role)) {
        throw new CustomError(`Access denied. Role ${role} cannot access ${resourceType} resources.`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to validate user permissions for specific actions
 */
export const checkPermission = (action: string, resource: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required.', 401);
      }

      const role = req.user.role;
      
      // Define permissions matrix
      const permissions = {
        ADMIN: {
          events: ['create', 'read', 'update', 'delete', 'publish', 'cancel'],
          venues: ['create', 'read', 'update', 'delete', 'verify'],
          tickets: ['create', 'read', 'update', 'delete', 'refund'],
          users: ['create', 'read', 'update', 'delete', 'suspend'],
          payments: ['read', 'update', 'refund'],
          subscriptions: ['create', 'read', 'update', 'delete'],
          analytics: ['read', 'export'],
        },
        ORGANIZER: {
          events: ['create', 'read', 'update', 'delete', 'publish', 'cancel'],
          venues: ['read'],
          tickets: ['read', 'update', 'refund'],
          payments: ['read'],
          subscriptions: ['read', 'upgrade'],
          analytics: ['read'],
        },
        VENUE_OWNER: {
          venues: ['create', 'read', 'update'],
          events: ['read'],
          tickets: ['read'],
        },
        BUYER: {
          events: ['read'],
          tickets: ['create', 'read'],
          payments: ['create', 'read'],
        },
      };

      const rolePermissions = permissions[role];
      if (!rolePermissions || !rolePermissions[resource] || !rolePermissions[resource].includes(action)) {
        throw new CustomError(`Permission denied. Role ${role} cannot perform ${action} on ${resource}.`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Legacy role-specific middleware (for backward compatibility)
export const requireAdmin = authorize(UserRole.ADMIN);
export const requireOrganizer = authorize(UserRole.ORGANIZER, UserRole.ADMIN);
export const requireVenue = authorize(UserRole.VENUE_OWNER, UserRole.ADMIN);
export const requireBuyer = authorize(UserRole.BUYER, UserRole.ADMIN);
