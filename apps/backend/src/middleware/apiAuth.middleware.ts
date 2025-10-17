import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../services/apiKey.service';
import { rateLimitService } from '../services/rateLimit.service';
import { AppError } from '../utils/appError.util';
import { logger } from '../utils/logger.util';
import { redis } from '../config/redis.config';

export interface ApiRequest extends Request {
  apiKey?: {
    id: string;
    organizerId: string;
    permissions: string[];
    rateLimit: number;
    allowedDomains: string[];
  };
  user?: {
    id: string;
    role: string;
  };
}

/**
 * API Key Authentication Middleware
 */
export const authenticateApiKey = async (
  req: ApiRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new AppError('API key is required', 401);
    }

    // Validate API key
    const validation = await apiKeyService.validateApiKey(apiKey);
    
    if (!validation.isValid) {
      throw new AppError(validation.error || 'Invalid API key', 401);
    }

    // Check domain restrictions
    const origin = req.headers.origin || req.headers.referer;
    if (origin) {
      const domain = new URL(origin).hostname;
      const isDomainAllowed = await apiKeyService.isDomainAllowed(apiKey, domain);
      
      if (!isDomainAllowed) {
        throw new AppError('Domain not allowed for this API key', 403);
      }
    }

    // Set API key info in request
    req.apiKey = {
      id: validation.apiKey!.id,
      organizerId: validation.apiKey!.organizerId,
      permissions: validation.apiKey!.permissions,
      rateLimit: validation.apiKey!.rateLimit,
      allowedDomains: validation.apiKey!.allowedDomains
    };

    next();
  } catch (error: any) {
    logger.error('API key authentication failed:', error);
    next(error);
  }
};

/**
 * Rate Limiting Middleware
 */
export const rateLimitApiKey = async (
  req: ApiRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.apiKey) {
      throw new AppError('API key not authenticated', 401);
    }

    // Check rate limit using the rate limiting service
    const result = await rateLimitService.checkApiKeyRateLimit(req.apiKey.id, req.apiKey.rateLimit);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': req.apiKey.rateLimit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    });

    if (!result.allowed) {
      res.set('Retry-After', result.retryAfter?.toString());
      throw new AppError('API rate limit exceeded', 429);
    }

    next();
  } catch (error: any) {
    logger.error('Rate limiting failed:', error);
    next(error);
  }
};

/**
 * Permission-based Authorization Middleware
 */
export const requirePermission = (permission: string) => {
  return (req: ApiRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.apiKey) {
        throw new AppError('API key not authenticated', 401);
      }

      const hasPermission = req.apiKey.permissions.includes(permission) || 
                           req.apiKey.permissions.includes('*');

      if (!hasPermission) {
        throw new AppError(`Permission '${permission}' is required`, 403);
      }

      next();
    } catch (error: any) {
      logger.error('Permission check failed:', error);
      next(error);
    }
  };
};

/**
 * Multiple Permissions Authorization Middleware
 */
export const requireAnyPermission = (permissions: string[]) => {
  return (req: ApiRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.apiKey) {
        throw new AppError('API key not authenticated', 401);
      }

      const hasPermission = permissions.some(permission => 
        req.apiKey!.permissions.includes(permission) || 
        req.apiKey!.permissions.includes('*')
      );

      if (!hasPermission) {
        throw new AppError(`One of the following permissions is required: ${permissions.join(', ')}`, 403);
      }

      next();
    } catch (error: any) {
      logger.error('Permission check failed:', error);
      next(error);
    }
  };
};

/**
 * All Permissions Authorization Middleware
 */
export const requireAllPermissions = (permissions: string[]) => {
  return (req: ApiRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.apiKey) {
        throw new AppError('API key not authenticated', 401);
      }

      const hasAllPermissions = permissions.every(permission => 
        req.apiKey!.permissions.includes(permission) || 
        req.apiKey!.permissions.includes('*')
      );

      if (!hasAllPermissions) {
        throw new AppError(`All of the following permissions are required: ${permissions.join(', ')}`, 403);
      }

      next();
    } catch (error: any) {
      logger.error('Permission check failed:', error);
      next(error);
    }
  };
};

/**
 * Organizer Ownership Check Middleware
 */
export const checkOrganizerOwnership = (req: ApiRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.apiKey) {
      throw new AppError('API key not authenticated', 401);
    }

    const resourceOrganizerId = req.params.organizerId || req.body.organizerId;

    if (resourceOrganizerId && resourceOrganizerId !== req.apiKey.organizerId) {
      throw new AppError('Access denied: Resource belongs to different organizer', 403);
    }

    next();
  } catch (error: any) {
    logger.error('Organizer ownership check failed:', error);
    next(error);
  }
};

/**
 * OAuth 2.0 Authentication Middleware (for future implementation)
 */
export const authenticateOAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('OAuth token is required', 401);
    }

    const token = authHeader.substring(7);

    // TODO: Implement OAuth token validation
    // This would typically involve:
    // 1. Decode and verify JWT token
    // 2. Check token expiration
    // 3. Validate token signature
    // 4. Extract user/organizer information
    // 5. Set req.user with token information

    // For now, throw not implemented error
    throw new AppError('OAuth authentication not yet implemented', 501);
  } catch (error: any) {
    logger.error('OAuth authentication failed:', error);
    next(error);
  }
};

/**
 * Flexible Authentication Middleware (API Key or OAuth)
 */
export const authenticateFlexible = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Try API key first
    if (req.headers['x-api-key']) {
      return authenticateApiKey(req as ApiRequest, res, next);
    }

    // Try OAuth token
    if (req.headers.authorization) {
      return authenticateOAuth(req, res, next);
    }

    throw new AppError('Authentication required (API key or OAuth token)', 401);
  } catch (error: any) {
    logger.error('Flexible authentication failed:', error);
    next(error);
  }
};

/**
 * API Usage Tracking Middleware
 */
export const trackApiUsage = async (
  req: ApiRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const startTime = Date.now();

    // Override res.end to track response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - startTime;
      
      // Track API usage (async, don't wait)
      if (req.apiKey) {
        trackUsageAsync(req.apiKey.id, req.method, req.path, res.statusCode, duration);
      }

      originalEnd.call(this, chunk, encoding);
    };

    next();
  } catch (error: any) {
    logger.error('API usage tracking failed:', error);
    next(error);
  }
};

/**
 * Track API usage asynchronously
 */
async function trackUsageAsync(
  apiKeyId: string,
  method: string,
  path: string,
  statusCode: number,
  duration: number
): Promise<void> {
  try {
    const usageData = {
      apiKeyId,
      method,
      path,
      statusCode,
      duration,
      timestamp: new Date().toISOString()
    };

    // Store in Redis for real-time analytics
    await redis.lpush(`api_usage:${apiKeyId}`, JSON.stringify(usageData));
    await redis.ltrim(`api_usage:${apiKeyId}`, 0, 999); // Keep last 1000 requests

    // Store daily usage stats
    const today = new Date().toISOString().split('T')[0];
    await redis.hincrby(`api_daily_usage:${apiKeyId}:${today}`, 'requests', 1);
    await redis.hincrby(`api_daily_usage:${apiKeyId}:${today}`, 'duration', duration);
    
    if (statusCode >= 400) {
      await redis.hincrby(`api_daily_usage:${apiKeyId}:${today}`, 'errors', 1);
    }

    // Set expiration for daily stats (keep for 30 days)
    await redis.expire(`api_daily_usage:${apiKeyId}:${today}`, 30 * 24 * 60 * 60);
  } catch (error) {
    logger.error('Failed to track API usage:', error);
    // Don't throw - this shouldn't break the main request
  }
}
