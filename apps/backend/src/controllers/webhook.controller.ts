import { Request, Response, NextFunction } from 'express';
import { webhookService } from '../services/webhook.service';
import { AppError } from '../utils/appError.util';
import { catchAsync } from '../utils/catchAsync.util';
import { logger } from '../utils/logger.util';
import { AuthRequest } from '../types/auth.types';

export const webhookController = {
  /**
   * Create new webhook
   */
  createWebhook: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { url, events, retryConfig } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      return next(new AppError('URL and events are required', 400));
    }

    try {
      const webhook = await webhookService.createWebhook({
        organizerId: userId,
        url,
        events,
        retryConfig
      });

      logger.info(`Webhook created by user ${userId}: ${webhook.id}`);

      res.status(201).json({
        status: 'success',
        message: 'Webhook created successfully',
        data: { webhook }
      });
    } catch (error: any) {
      logger.error('Failed to create webhook:', error);
      next(error);
    }
  }),

  /**
   * Get user's webhooks
   */
  getWebhooks: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    try {
      const webhooks = await webhookService.getWebhooksByOrganizerId(userId);
      
      res.status(200).json({
        status: 'success',
        data: { webhooks }
      });
    } catch (error: any) {
      logger.error('Failed to get webhooks:', error);
      next(error);
    }
  }),

  /**
   * Get webhook by ID
   */
  getWebhookById: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    try {
      const webhook = await webhookService.getWebhookById(id, userId);
      
      if (!webhook) {
        return next(new AppError('Webhook not found', 404));
      }

      res.status(200).json({
        status: 'success',
        data: { webhook }
      });
    } catch (error: any) {
      logger.error('Failed to get webhook:', error);
      next(error);
    }
  }),

  /**
   * Update webhook
   */
  updateWebhook: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { url, events, isActive, retryConfig } = req.body;

    try {
      const webhook = await webhookService.updateWebhook(id, userId, {
        url,
        events,
        isActive,
        retryConfig
      });

      logger.info(`Webhook updated by user ${userId}: ${id}`);

      res.status(200).json({
        status: 'success',
        message: 'Webhook updated successfully',
        data: { webhook }
      });
    } catch (error: any) {
      logger.error('Failed to update webhook:', error);
      next(error);
    }
  }),

  /**
   * Delete webhook
   */
  deleteWebhook: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    try {
      await webhookService.deleteWebhook(id, userId);

      logger.info(`Webhook deleted by user ${userId}: ${id}`);

      res.status(200).json({
        status: 'success',
        message: 'Webhook deleted successfully'
      });
    } catch (error: any) {
      logger.error('Failed to delete webhook:', error);
      next(error);
    }
  }),

  /**
   * Test webhook
   */
  testWebhook: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    try {
      const result = await webhookService.testWebhook(id, userId);

      res.status(200).json({
        status: 'success',
        message: result.success ? 'Webhook test successful' : 'Webhook test failed',
        data: result
      });
    } catch (error: any) {
      logger.error('Failed to test webhook:', error);
      next(error);
    }
  }),

  /**
   * Get webhook delivery logs
   */
  getWebhookLogs: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    try {
      const logs = await webhookService.getWebhookLogs(
        id,
        userId,
        Number(page),
        Number(limit)
      );

      res.status(200).json({
        status: 'success',
        data: logs
      });
    } catch (error: any) {
      logger.error('Failed to get webhook logs:', error);
      next(error);
    }
  }),

  /**
   * Retry failed webhook delivery
   */
  retryWebhookDelivery: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { logId } = req.body;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!logId) {
      return next(new AppError('Log ID is required', 400));
    }

    try {
      const result = await webhookService.retryWebhookDelivery(logId, userId);

      res.status(200).json({
        status: 'success',
        message: result.success ? 'Webhook delivery retry successful' : 'Webhook delivery retry failed',
        data: result
      });
    } catch (error: any) {
      logger.error('Failed to retry webhook delivery:', error);
      next(error);
    }
  }),

  /**
   * Get webhook statistics
   */
  getWebhookStats: catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    try {
      const stats = await webhookService.getWebhookStats(userId);

      res.status(200).json({
        status: 'success',
        data: { stats }
      });
    } catch (error: any) {
      logger.error('Failed to get webhook stats:', error);
      next(error);
    }
  }),

  /**
   * Get valid webhook events
   */
  getValidEvents: catchAsync(async (req: Request, res: Response) => {
    const events = webhookService.getValidEvents();

    res.status(200).json({
      status: 'success',
      data: { events }
    });
  }),

  /**
   * Receive webhook (for external webhook endpoints)
   */
  receiveWebhook: catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { webhookId } = req.params;
    const { event, data } = req.body;

    logger.info(`Received webhook ${webhookId} for event ${event}`, { payload: req.body });

    // Validate webhook exists and is active
    // This would typically involve looking up the webhook by ID
    // and verifying the signature

    res.status(200).json({
      status: 'success',
      message: 'Webhook received successfully'
    });
  })
};
