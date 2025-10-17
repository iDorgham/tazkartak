import { redis } from '../config/redis.config';
import { logger } from '../utils/logger.util';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimitService {
  /**
   * Check API key rate limit
   */
  static async checkApiKeyRateLimit(
    apiKeyId: string,
    rateLimit: number,
    windowMs: number = 60 * 60 * 1000 // 1 hour default
  ): Promise<RateLimitResult> {
    try {
      const window = Math.floor(Date.now() / windowMs);
      const key = `api_rate_limit:${apiKeyId}:${window}`;
      
      // Get current usage
      const currentUsage = await redis.get(key);
      const usage = currentUsage ? parseInt(currentUsage) : 0;
      
      // Check if limit exceeded
      if (usage >= rateLimit) {
        const resetTime = (window + 1) * windowMs;
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter
        };
      }
      
      // Increment usage
      await redis.incr(key);
      await redis.expire(key, Math.ceil(windowMs / 1000));
      
      const resetTime = (window + 1) * windowMs;
      
      return {
        allowed: true,
        remaining: rateLimit - usage - 1,
        resetTime
      };
    } catch (error: any) {
      logger.error('Rate limit check failed:', error);
      // On error, allow the request to proceed
      return {
        allowed: true,
        remaining: rateLimit,
        resetTime: Date.now() + windowMs
      };
    }
  }

  /**
   * Check user rate limit
   */
  static async checkUserRateLimit(
    userId: string,
    rateLimit: number,
    windowMs: number = 15 * 60 * 1000 // 15 minutes default
  ): Promise<RateLimitResult> {
    try {
      const window = Math.floor(Date.now() / windowMs);
      const key = `user_rate_limit:${userId}:${window}`;
      
      // Get current usage
      const currentUsage = await redis.get(key);
      const usage = currentUsage ? parseInt(currentUsage) : 0;
      
      // Check if limit exceeded
      if (usage >= rateLimit) {
        const resetTime = (window + 1) * windowMs;
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter
        };
      }
      
      // Increment usage
      await redis.incr(key);
      await redis.expire(key, Math.ceil(windowMs / 1000));
      
      const resetTime = (window + 1) * windowMs;
      
      return {
        allowed: true,
        remaining: rateLimit - usage - 1,
        resetTime
      };
    } catch (error: any) {
      logger.error('User rate limit check failed:', error);
      // On error, allow the request to proceed
      return {
        allowed: true,
        remaining: rateLimit,
        resetTime: Date.now() + windowMs
      };
    }
  }

  /**
   * Check IP rate limit
   */
  static async checkIpRateLimit(
    ip: string,
    rateLimit: number,
    windowMs: number = 15 * 60 * 1000 // 15 minutes default
  ): Promise<RateLimitResult> {
    try {
      const window = Math.floor(Date.now() / windowMs);
      const key = `ip_rate_limit:${ip}:${window}`;
      
      // Get current usage
      const currentUsage = await redis.get(key);
      const usage = currentUsage ? parseInt(currentUsage) : 0;
      
      // Check if limit exceeded
      if (usage >= rateLimit) {
        const resetTime = (window + 1) * windowMs;
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter
        };
      }
      
      // Increment usage
      await redis.incr(key);
      await redis.expire(key, Math.ceil(windowMs / 1000));
      
      const resetTime = (window + 1) * windowMs;
      
      return {
        allowed: true,
        remaining: rateLimit - usage - 1,
        resetTime
      };
    } catch (error: any) {
      logger.error('IP rate limit check failed:', error);
      // On error, allow the request to proceed
      return {
        allowed: true,
        remaining: rateLimit,
        resetTime: Date.now() + windowMs
      };
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  static async resetRateLimit(key: string): Promise<void> {
    try {
      await redis.del(key);
      logger.info(`Rate limit reset for key: ${key}`);
    } catch (error: any) {
      logger.error('Failed to reset rate limit:', error);
    }
  }

  /**
   * Get rate limit status
   */
  static async getRateLimitStatus(key: string): Promise<{
    usage: number;
    limit: number;
    resetTime: number;
  } | null> {
    try {
      const currentUsage = await redis.get(key);
      const usage = currentUsage ? parseInt(currentUsage) : 0;
      
      // Extract limit and window from key pattern
      const parts = key.split(':');
      if (parts.length < 3) return null;
      
      const window = parseInt(parts[parts.length - 1]);
      const windowMs = 60 * 60 * 1000; // Default 1 hour
      const resetTime = (window + 1) * windowMs;
      
      // Default limit - in real implementation, this would be fetched from config
      const limit = 1000;
      
      return {
        usage,
        limit,
        resetTime
      };
    } catch (error: any) {
      logger.error('Failed to get rate limit status:', error);
      return null;
    }
  }
}