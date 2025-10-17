import Queue from 'bull';
import IORedis from 'ioredis';
import { webhookService } from './webhook.service';
import { generateWebhookSignature, createWebhookPayload } from '../utils/webhookSignature.util';
import { logger } from '../utils/logger.util';
import { AppError } from '../utils/appError.util';

// Redis connection for Bull queues
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
};

// Create Redis connection
const redis = new IORedis(redisConfig);

// Webhook delivery queue
const webhookQueue = new Queue('webhook-delivery', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds
    },
  },
});

// Webhook retry queue for manual retries
const webhookRetryQueue = new Queue('webhook-retry', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

interface WebhookJobData {
  webhookId: string;
  event: string;
  payload: any;
  attempt: number;
  maxAttempts: number;
  retryConfig: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialIntervalSeconds: number;
  };
}

interface WebhookRetryJobData {
  webhookLogId: string;
  webhookId: string;
  event: string;
  payload: any;
  attempt: number;
}

export class WebhookWorkerService {
  private static instance: WebhookWorkerService;

  public static getInstance(): WebhookWorkerService {
    if (!WebhookWorkerService.instance) {
      WebhookWorkerService.instance = new WebhookWorkerService();
    }
    return WebhookWorkerService.instance;
  }

  private constructor() {
    this.setupProcessors();
    this.setupErrorHandling();
  }

  /**
   * Add webhook delivery job to queue
   */
  async queueWebhookDelivery(
    webhookId: string,
    event: string,
    payload: any,
    retryConfig?: any
  ): Promise<void> {
    try {
      const jobData: WebhookJobData = {
        webhookId,
        event,
        payload,
        attempt: 1,
        maxAttempts: retryConfig?.maxAttempts || 5,
        retryConfig: retryConfig || {
          maxAttempts: 5,
          backoffMultiplier: 2,
          initialIntervalSeconds: 60,
        },
      };

      await webhookQueue.add('deliver-webhook', jobData, {
        delay: 0, // Immediate delivery
        jobId: `${webhookId}-${event}-${Date.now()}`, // Unique job ID
      });

      logger.info(`Webhook delivery queued for webhook ${webhookId}, event: ${event}`);
    } catch (error: any) {
      logger.error(`Failed to queue webhook delivery: ${error.message}`, error);
      throw new AppError('Failed to queue webhook delivery', 500);
    }
  }

  /**
   * Add webhook retry job to queue
   */
  async queueWebhookRetry(
    webhookLogId: string,
    webhookId: string,
    event: string,
    payload: any,
    attempt: number
  ): Promise<void> {
    try {
      const jobData: WebhookRetryJobData = {
        webhookLogId,
        webhookId,
        event,
        payload,
        attempt,
      };

      await webhookRetryQueue.add('retry-webhook', jobData, {
        delay: 0,
        jobId: `retry-${webhookLogId}-${Date.now()}`,
      });

      logger.info(`Webhook retry queued for log ${webhookLogId}`);
    } catch (error: any) {
      logger.error(`Failed to queue webhook retry: ${error.message}`, error);
      throw new AppError('Failed to queue webhook retry', 500);
    }
  }

  /**
   * Setup job processors
   */
  private setupProcessors(): void {
    // Process webhook delivery jobs
    webhookQueue.process('deliver-webhook', 10, async (job) => {
      const { webhookId, event, payload, attempt, retryConfig } = job.data as WebhookJobData;
      
      logger.info(`Processing webhook delivery job: ${job.id}, attempt: ${attempt}`);

      try {
        // Get webhook details
        const webhook = await webhookService.getWebhookById(webhookId);
        if (!webhook) {
          throw new Error(`Webhook ${webhookId} not found`);
        }

        if (!webhook.isActive) {
          logger.warn(`Webhook ${webhookId} is inactive, skipping delivery`);
          return;
        }

        // Create standardized payload
        const standardizedPayload = createWebhookPayload(event, payload, {
          id: job.id,
          timestamp: new Date(),
        });

        // Generate signature
        const signature = generateWebhookSignature(
          JSON.stringify(standardizedPayload),
          webhook.secret
        );

        // Create webhook log entry
        const logEntry = await this.createWebhookLog(webhookId, event, standardizedPayload, 'pending', attempt);

        // Send webhook
        const response = await this.sendWebhookRequest(webhook.url, standardizedPayload, signature);

        // Update log entry with success
        await this.updateWebhookLog(logEntry.id, 'delivered', response.data, new Date());

        logger.info(`Webhook ${webhookId} delivered successfully on attempt ${attempt}`);
      } catch (error: any) {
        logger.error(`Webhook delivery failed for ${webhookId}, attempt ${attempt}: ${error.message}`);

        // Update log entry with failure
        const logEntry = await this.findWebhookLog(webhookId, event, attempt);
        if (logEntry) {
          await this.updateWebhookLog(logEntry.id, 'failed', { error: error.message }, null);
        }

        // Check if we should retry
        if (attempt < retryConfig.maxAttempts) {
          const delay = retryConfig.initialIntervalSeconds * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
          logger.info(`Scheduling retry for webhook ${webhookId} in ${delay} seconds`);
          
          // Throw error to trigger Bull's retry mechanism
          throw new Error(`Webhook delivery failed: ${error.message}`);
        } else {
          logger.warn(`Webhook ${webhookId} exhausted all retry attempts`);
          // Could trigger alert to organizer here
        }
      }
    });

    // Process webhook retry jobs
    webhookRetryQueue.process('retry-webhook', 5, async (job) => {
      const { webhookLogId, webhookId, event, payload, attempt } = job.data as WebhookRetryJobData;
      
      logger.info(`Processing webhook retry job: ${job.id}, attempt: ${attempt}`);

      try {
        const webhook = await webhookService.getWebhookById(webhookId);
        if (!webhook) {
          throw new Error(`Webhook ${webhookId} not found`);
        }

        if (!webhook.isActive) {
          logger.warn(`Webhook ${webhookId} is inactive, skipping retry`);
          return;
        }

        const signature = generateWebhookSignature(JSON.stringify(payload), webhook.secret);
        const response = await this.sendWebhookRequest(webhook.url, payload, signature);

        // Update the original log entry
        await this.updateWebhookLog(webhookLogId, 'delivered', response.data, new Date());

        logger.info(`Webhook retry successful for log ${webhookLogId}`);
      } catch (error: any) {
        logger.error(`Webhook retry failed for log ${webhookLogId}: ${error.message}`);
        await this.updateWebhookLog(webhookLogId, 'failed', { error: error.message }, null);
        throw error;
      }
    });
  }

  /**
   * Setup error handling for queues
   */
  private setupErrorHandling(): void {
    webhookQueue.on('failed', (job, err) => {
      logger.error(`Webhook delivery job ${job.id} failed:`, err);
    });

    webhookQueue.on('stalled', (job) => {
      logger.warn(`Webhook delivery job ${job.id} stalled`);
    });

    webhookRetryQueue.on('failed', (job, err) => {
      logger.error(`Webhook retry job ${job.id} failed:`, err);
    });

    webhookRetryQueue.on('stalled', (job) => {
      logger.warn(`Webhook retry job ${job.id} stalled`);
    });
  }

  /**
   * Send webhook HTTP request
   */
  private async sendWebhookRequest(url: string, payload: any, signature: string): Promise<any> {
    const axios = require('axios');
    
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'User-Agent': 'Tazkartak-Webhook/1.0',
      },
      timeout: 30000, // 30 seconds timeout
      validateStatus: (status: number) => status < 500, // Accept 4xx as valid responses
    });

    return response;
  }

  /**
   * Create webhook log entry
   */
  private async createWebhookLog(
    webhookId: string,
    event: string,
    payload: any,
    status: string,
    attempts: number
  ): Promise<any> {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    return prisma.webhookLog.create({
      data: {
        webhookId,
        event,
        payload,
        status,
        attempts,
      },
    });
  }

  /**
   * Update webhook log entry
   */
  private async updateWebhookLog(
    logId: string,
    status: string,
    response: any,
    deliveredAt: Date | null
  ): Promise<void> {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.webhookLog.update({
      where: { id: logId },
      data: {
        status,
        response,
        deliveredAt,
      },
    });
  }

  /**
   * Find webhook log entry
   */
  private async findWebhookLog(webhookId: string, event: string, attempt: number): Promise<any> {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    return prisma.webhookLog.findFirst({
      where: {
        webhookId,
        event,
        attempts: attempt,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    const webhookStats = await webhookQueue.getJobCounts();
    const retryStats = await webhookRetryQueue.getJobCounts();

    return {
      webhook: webhookStats,
      retry: retryStats,
      redis: {
        connected: redis.status === 'ready',
        status: redis.status,
      },
    };
  }

  /**
   * Clean up completed and failed jobs
   */
  async cleanupJobs(): Promise<void> {
    try {
      await webhookQueue.clean(24 * 60 * 60 * 1000, 'completed'); // 24 hours
      await webhookQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // 7 days
      await webhookRetryQueue.clean(24 * 60 * 60 * 1000, 'completed');
      await webhookRetryQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
      
      logger.info('Webhook queue cleanup completed');
    } catch (error: any) {
      logger.error('Failed to cleanup webhook queues:', error);
    }
  }

  /**
   * Pause all queues
   */
  async pauseQueues(): Promise<void> {
    await webhookQueue.pause();
    await webhookRetryQueue.pause();
    logger.info('Webhook queues paused');
  }

  /**
   * Resume all queues
   */
  async resumeQueues(): Promise<void> {
    await webhookQueue.resume();
    await webhookRetryQueue.resume();
    logger.info('Webhook queues resumed');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down webhook worker service...');
    
    await webhookQueue.close();
    await webhookRetryQueue.close();
    redis.disconnect();
    
    logger.info('Webhook worker service shut down');
  }
}

// Export singleton instance
export const webhookWorkerService = WebhookWorkerService.getInstance();
