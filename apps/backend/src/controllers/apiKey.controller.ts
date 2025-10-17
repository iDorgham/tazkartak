import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../services/apiKey.service';
import { AppError } from '../utils/appError.util';
import { catchAsync } from '../utils/catchAsync.util';
import { logger } from '../utils/logger.util';
import { AuthRequest } from '../types/auth.types';

export const apiKeyController = {
  /**
   * Create new API key
   */
  createApiKey: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { name, permissions, rateLimit, allowedDomains, expiresAt } = req.body;

    if (!name) {
      return next(new AppError('API key name is required', 400));
    }

    try {
      const result = await apiKeyService.createApiKey({
        organizerId: userId,
        name,
        permissions,
        rateLimit,
        allowedDomains,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });

      logger.info(`API key created by user ${userId}: ${result.apiKey.id}`);

      res.status(201).json({
        status: 'success',
        message: 'API key created successfully',
        data: {
          apiKey: result.apiKey,
          plainKey: result.plainKey // Only returned once
        }
      });
    } catch (error: any) {
      logger.error('Failed to create API key:', error);
      next(error);
    }
  }),

  /**
   * Get user's API keys
   */
  getApiKeys: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    try {
      const apiKeys = await apiKeyService.getApiKeysByOrganizerId(userId);
      
      res.status(200).json({
        status: 'success',
        data: { apiKeys }
      });
    } catch (error: any) {
      logger.error('Failed to get API keys:', error);
      next(error);
    }
  }),

  /**
   * Get API key details
   */
  getApiKeyById: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    try {
      const apiKey = await apiKeyService.getApiKeyById(id, userId);
      
      if (!apiKey) {
        return next(new AppError('API key not found', 404));
      }

      res.status(200).json({
        status: 'success',
        data: { apiKey }
      });
    } catch (error: any) {
      logger.error('Failed to get API key:', error);
      next(error);
    }
  }),

  /**
   * Update API key
   */
  updateApiKey: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { name, permissions, rateLimit, allowedDomains, expiresAt, isActive } = req.body;

    try {
      const apiKey = await apiKeyService.updateApiKey(id, userId, {
        name,
        permissions,
        rateLimit,
        allowedDomains,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        isActive
      });

      logger.info(`API key updated by user ${userId}: ${id}`);

      res.status(200).json({
        status: 'success',
        message: 'API key updated successfully',
        data: { apiKey }
      });
    } catch (error: any) {
      logger.error('Failed to update API key:', error);
      next(error);
    }
  }),

  /**
   * Delete API key
   */
  deleteApiKey: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    try {
      await apiKeyService.deleteApiKey(id, userId);

      logger.info(`API key deleted by user ${userId}: ${id}`);

      res.status(200).json({
        status: 'success',
        message: 'API key deleted successfully'
      });
    } catch (error: any) {
      logger.error('Failed to delete API key:', error);
      next(error);
    }
  }),

  /**
   * Rotate API key
   */
  rotateApiKey: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    try {
      const result = await apiKeyService.rotateApiKey(id, userId);

      logger.info(`API key rotated by user ${userId}: ${id} -> ${result.apiKey.id}`);

      res.status(200).json({
        status: 'success',
        message: 'API key rotated successfully',
        data: {
          apiKey: result.apiKey,
          plainKey: result.plainKey // Only returned once
        }
      });
    } catch (error: any) {
      logger.error('Failed to rotate API key:', error);
      next(error);
    }
  }),

  /**
   * Get API key usage statistics
   */
  getApiKeyUsage: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    try {
      const usage = await apiKeyService.getApiKeyUsage(id);

      res.status(200).json({
        status: 'success',
        data: { usage }
      });
    } catch (error: any) {
      logger.error('Failed to get API key usage:', error);
      next(error);
    }
  }),

  /**
   * Get API key statistics for user
   */
  getApiKeyStats: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    try {
      const stats = await apiKeyService.getApiKeyStats(userId);

      res.status(200).json({
        status: 'success',
        data: { stats }
      });
    } catch (error: any) {
      logger.error('Failed to get API key stats:', error);
      next(error);
    }
  }),

  /**
   * Get valid permissions
   */
  getValidPermissions: catchAsync(async (req: Request, res: Response) => {
    const permissions = apiKeyService.getValidPermissions();

    res.status(200).json({
      status: 'success',
      data: { permissions }
    });
  })
};
