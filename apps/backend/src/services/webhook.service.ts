import { PrismaClient } from '@prisma/client';
import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto';
import { AppError } from '../utils/appError.util';
import { logger } from '../utils/logger.util';
import { generateWebhookSignature } from '../utils/webhookSignature.util';
import { webhookWorkerService } from './webhookWorker.service';

const prisma = new PrismaClient();

export interface Webhook {
  id: string;
  organizerId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  retryConfig: {
    maxAttempts: number;
    backoffMultiplier: number;
    timeout: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  deliveredAt?: Date;
  response?: any;
  error?: string;
  createdAt: Date;
}

export interface CreateWebhookData {
  organizerId: string;
  url: string;
  events: string[];
  retryConfig?: {
    maxAttempts?: number;
    backoffMultiplier?: number;
    timeout?: number;
  };
}

export interface UpdateWebhookData {
  url?: string;
  events?: string[];
  isActive?: boolean;
  retryConfig?: {
    maxAttempts?: number;
    backoffMultiplier?: number;
    timeout?: number;
  };
}

export class WebhookService {
  private readonly DEFAULT_RETRY_CONFIG = {
    maxAttempts: 5,
    backoffMultiplier: 2,
    timeout: 30000 // 30 seconds
  };

  private readonly VALID_EVENTS = [
    'ticket.purchased',
    'ticket.scanned',
    'ticket.refunded',
    'event.created',
    'event.updated',
    'event.cancelled',
    'payment.completed',
    'payment.failed',
    'subscription.created',
    'subscription.cancelled'
  ];

  /**
   * Create a new webhook
   */
  async createWebhook(data: CreateWebhookData): Promise<Webhook> {
    try {
      // Validate URL
      if (!this.isValidUrl(data.url)) {
        throw new AppError('Invalid webhook URL', 400);
      }

      // Validate events
      const invalidEvents = data.events.filter(event => !this.VALID_EVENTS.includes(event));
      if (invalidEvents.length > 0) {
        throw new AppError(`Invalid events: ${invalidEvents.join(', ')}`, 400);
      }

      // Validate organizer exists
      const organizer = await prisma.organizer.findUnique({
        where: { userId: data.organizerId }
      });

      if (!organizer) {
        throw new AppError('Organizer not found', 404);
      }

      // Generate secret
      const secret = crypto.randomBytes(32).toString('hex');

      // Create webhook
      const webhook = await prisma.webhook.create({
        data: {
          organizerId: data.organizerId,
          url: data.url,
          events: data.events,
          secret,
          retryConfig: {
            ...this.DEFAULT_RETRY_CONFIG,
            ...data.retryConfig
          }
        }
      });

      logger.info(`Webhook created for organizer ${data.organizerId}: ${webhook.id}`);

      return webhook as Webhook;
    } catch (error: any) {
      logger.error('Failed to create webhook:', error);
      throw error;
    }
  }

  /**
   * Get webhooks for an organizer
   */
  async getWebhooksByOrganizerId(organizerId: string): Promise<Webhook[]> {
    try {
      const webhooks = await prisma.webhook.findMany({
        where: { organizerId },
        orderBy: { createdAt: 'desc' }
      });

      return webhooks as Webhook[];
    } catch (error: any) {
      logger.error('Failed to get webhooks:', error);
      throw error;
    }
  }

  /**
   * Get webhook by ID
   */
  async getWebhookById(id: string, organizerId: string): Promise<Webhook | null> {
    try {
      const webhook = await prisma.webhook.findFirst({
        where: { id, organizerId }
      });

      return webhook as Webhook | null;
    } catch (error: any) {
      logger.error('Failed to get webhook:', error);
      throw error;
    }
  }

  /**
   * Update webhook
   */
  async updateWebhook(id: string, organizerId: string, data: UpdateWebhookData): Promise<Webhook> {
    try {
      const existingWebhook = await this.getWebhookById(id, organizerId);
      if (!existingWebhook) {
        throw new AppError('Webhook not found', 404);
      }

      const updateData: any = {};

      if (data.url) {
        if (!this.isValidUrl(data.url)) {
          throw new AppError('Invalid webhook URL', 400);
        }
        updateData.url = data.url;
      }

      if (data.events) {
        const invalidEvents = data.events.filter(event => !this.VALID_EVENTS.includes(event));
        if (invalidEvents.length > 0) {
          throw new AppError(`Invalid events: ${invalidEvents.join(', ')}`, 400);
        }
        updateData.events = data.events;
      }

      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }

      if (data.retryConfig) {
        updateData.retryConfig = {
          ...existingWebhook.retryConfig,
          ...data.retryConfig
        };
      }

      const updatedWebhook = await prisma.webhook.update({
        where: { id },
        data: updateData
      });

      logger.info(`Webhook updated: ${id}`);

      return updatedWebhook as Webhook;
    } catch (error: any) {
      logger.error('Failed to update webhook:', error);
      throw error;
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: string, organizerId: string): Promise<void> {
    try {
      const existingWebhook = await this.getWebhookById(id, organizerId);
      if (!existingWebhook) {
        throw new AppError('Webhook not found', 404);
      }

      await prisma.webhook.delete({
        where: { id }
      });

      logger.info(`Webhook deleted: ${id}`);
    } catch (error: any) {
      logger.error('Failed to delete webhook:', error);
      throw error;
    }
  }

  /**
   * Test webhook
   */
  async testWebhook(id: string, organizerId: string): Promise<{ success: boolean; response?: any; error?: string }> {
    try {
      const webhook = await this.getWebhookById(id, organizerId);
      if (!webhook) {
        throw new AppError('Webhook not found', 404);
      }

      const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook from Tazkartak',
          webhookId: webhook.id
        }
      };

      const result = await this.deliverWebhook(webhook, testPayload);

      return {
        success: result.success,
        response: result.response,
        error: result.error
      };
    } catch (error: any) {
      logger.error('Failed to test webhook:', error);
      throw error;
    }
  }

  /**
   * Get webhook delivery logs
   */
  async getWebhookLogs(id: string, organizerId: string, page: number = 1, limit: number = 50): Promise<{
    logs: WebhookEvent[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const webhook = await this.getWebhookById(id, organizerId);
      if (!webhook) {
        throw new AppError('Webhook not found', 404);
      }

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.webhookLog.findMany({
          where: { webhookId: id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.webhookLog.count({
          where: { webhookId: id }
        })
      ]);

      return {
        logs: logs as WebhookEvent[],
        total,
        page,
        limit
      };
    } catch (error: any) {
      logger.error('Failed to get webhook logs:', error);
      throw error;
    }
  }

  /**
   * Retry failed webhook delivery
   */
  async retryWebhookDelivery(webhookId: string, logId: string, organizerId: string): Promise<void> {
    try {
      const log = await prisma.webhookLog.findFirst({
        where: { id: logId },
        include: { webhook: true }
      });

      if (!log || log.webhook.organizerId !== organizerId) {
        throw new AppError('Webhook log not found', 404);
      }

      if (log.status === 'delivered') {
        throw new AppError('Webhook already delivered', 400);
      }

      // Queue the retry using the worker service
      await webhookWorkerService.queueWebhookRetry(
        logId,
        webhookId,
        log.event,
        log.payload,
        log.attempts + 1
      );

      logger.info(`Webhook retry queued for log ${logId}`);
    } catch (error: any) {
      logger.error('Failed to queue webhook retry:', error);
      throw error;
    }
  }

  /**
   * Trigger webhook for an event
   */
  async triggerWebhook(organizerId: string, event: string, payload: any): Promise<void> {
    try {
      // Find active webhooks for this organizer that listen to this event
      const webhooks = await prisma.webhook.findMany({
        where: {
          organizerId,
          isActive: true,
          events: {
            has: event
          }
        }
      });

      if (webhooks.length === 0) {
        logger.info(`No active webhooks found for event ${event} (organizer: ${organizerId})`);
        return;
      }

      // Queue webhook deliveries using the worker service
      for (const webhook of webhooks) {
        await webhookWorkerService.queueWebhookDelivery(
          webhook.id,
          event,
          payload,
          webhook.retryConfig
        );
      }

      logger.info(`Queued ${webhooks.length} webhooks for event ${event} (organizer: ${organizerId})`);
    } catch (error: any) {
      logger.error('Failed to trigger webhook:', error);
      // Don't throw - webhook failures shouldn't break the main flow
    }
  }

  /**
   * Deliver webhook asynchronously
   */
  private async deliverWebhookAsync(webhook: Webhook, payload: any, logId: string): Promise<void> {
    try {
      const result = await this.deliverWebhook(webhook, payload);

      // Update log
      await prisma.webhookLog.update({
        where: { id: logId },
        data: {
          attempts: { increment: 1 },
          status: result.success ? 'delivered' : 'failed',
          deliveredAt: result.success ? new Date() : undefined,
          response: result.response,
          error: result.error
        }
      });

      // If failed and not at max attempts, schedule retry
      if (!result.success && result.attempts < webhook.retryConfig.maxAttempts) {
        const delay = this.calculateRetryDelay(result.attempts, webhook.retryConfig.backoffMultiplier);
        
        setTimeout(() => {
          this.deliverWebhookAsync(webhook, payload, logId);
        }, delay);
      }
    } catch (error: any) {
      logger.error('Failed to deliver webhook asynchronously:', error);
      
      // Update log with error
      await prisma.webhookLog.update({
        where: { id: logId },
        data: {
          attempts: { increment: 1 },
          status: 'failed',
          error: error.message
        }
      });
    }
  }

  /**
   * Deliver webhook
   */
  private async deliverWebhook(webhook: Webhook, payload: any): Promise<{
    success: boolean;
    response?: any;
    error?: string;
    attempts: number;
  }> {
    try {
      const signature = generateWebhookSignature(JSON.stringify(payload), webhook.secret);

      const response: AxiosResponse = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
          'User-Agent': 'Tazkartak-Webhook/1.0'
        },
        timeout: webhook.retryConfig.timeout,
        validateStatus: (status) => status >= 200 && status < 300
      });

      return {
        success: true,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        },
        attempts: 1
      };
    } catch (error: any) {
      logger.error(`Webhook delivery failed for ${webhook.id}:`, error);

      return {
        success: false,
        error: error.message,
        attempts: 1
      };
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, multiplier: number): number {
    return Math.min(1000 * Math.pow(multiplier, attempt), 300000); // Max 5 minutes
  }

  /**
   * Validate URL
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Get valid webhook events
   */
  getValidEvents(): string[] {
    return [...this.VALID_EVENTS];
  }

  /**
   * Get webhook statistics for organizer
   */
  async getWebhookStats(organizerId: string): Promise<{
    totalWebhooks: number;
    activeWebhooks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
  }> {
    try {
      const [totalWebhooks, activeWebhooks] = await Promise.all([
        prisma.webhook.count({ where: { organizerId } }),
        prisma.webhook.count({ where: { organizerId, isActive: true } })
      ]);

      const webhooks = await prisma.webhook.findMany({
        where: { organizerId },
        select: { id: true }
      });

      const webhookIds = webhooks.map(w => w.id);

      const [totalDeliveries, successfulDeliveries, failedDeliveries] = await Promise.all([
        prisma.webhookLog.count({ where: { webhookId: { in: webhookIds } } }),
        prisma.webhookLog.count({ where: { webhookId: { in: webhookIds }, status: 'delivered' } }),
        prisma.webhookLog.count({ where: { webhookId: { in: webhookIds }, status: 'failed' } })
      ]);

      const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

      return {
        totalWebhooks,
        activeWebhooks,
        totalDeliveries,
        successfulDeliveries,
        failedDeliveries,
        successRate: Math.round(successRate * 100) / 100
      };
    } catch (error: any) {
      logger.error('Failed to get webhook stats:', error);
      throw error;
    }
  }
}

export const webhookService = new WebhookService();
