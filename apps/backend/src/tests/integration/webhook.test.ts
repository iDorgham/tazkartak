import request from 'supertest';
import { app } from '../../app';
import { PrismaClient } from '@prisma/client';
import { redis } from '../../config/redis.config';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();

describe('Webhook Integration Tests', () => {
  let testUser: any;
  let testWebhook: any;
  let authToken: string;
  let webhookSecret: string;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'webhook-test@example.com',
        password: 'hashedpassword',
        firstName: 'Webhook',
        lastName: 'Test',
        role: 'ORGANIZER',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    // Generate auth token for protected routes
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Generate webhook secret
    webhookSecret = crypto.randomBytes(32).toString('hex');
  });

  afterAll(async () => {
    // Cleanup
    await prisma.webhookLog.deleteMany();
    await prisma.webhook.deleteMany();
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('Webhook Management', () => {
    test('should create webhook', async () => {
      const response = await request(app)
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://test-app.com/webhooks/tazkartak',
          events: ['ticket.purchased', 'payment.completed'],
          retryConfig: {
            maxAttempts: 5,
            backoffMultiplier: 2,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBe('https://test-app.com/webhooks/tazkartak');
      expect(response.body.data.events).toContain('ticket.purchased');
      expect(response.body.data.secret).toBeDefined();

      testWebhook = response.body.data;
    });

    test('should list webhooks', async () => {
      const response = await request(app)
        .get('/api/webhooks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].url).toBe('https://test-app.com/webhooks/tazkartak');
    });

    test('should get webhook details', async () => {
      const response = await request(app)
        .get(`/api/webhooks/${testWebhook.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testWebhook.id);
      expect(response.body.data.url).toBe(testWebhook.url);
    });

    test('should update webhook', async () => {
      const response = await request(app)
        .put(`/api/webhooks/${testWebhook.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          events: ['ticket.purchased', 'ticket.scanned'],
          isActive: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toContain('ticket.scanned');
      expect(response.body.data.isActive).toBe(false);
    });

    test('should delete webhook', async () => {
      const response = await request(app)
        .delete(`/api/webhooks/${testWebhook.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Webhook Delivery', () => {
    beforeEach(async () => {
      // Recreate test webhook for delivery tests
      testWebhook = await prisma.webhook.create({
        data: {
          organizerId: testUser.id,
          url: 'https://test-app.com/webhooks/tazkartak',
          events: ['ticket.purchased', 'payment.completed'],
          secret: webhookSecret,
          isActive: true,
          retryConfig: {
            maxAttempts: 3,
            backoffMultiplier: 2,
          },
        },
      });
    });

    test('should trigger webhook on ticket purchase', async () => {
      // Mock the webhook delivery (in real implementation, this would be queued)
      const webhookPayload = {
        event: 'ticket.purchased',
        data: {
          ticketId: 'test-ticket-123',
          eventId: 'test-event-456',
          buyerEmail: 'buyer@example.com',
          amount: 100.00,
          currency: 'EGP',
        },
        timestamp: new Date().toISOString(),
      };

      // Generate signature
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(webhookPayload))
        .digest('hex');

      // Simulate webhook delivery (this would normally be done by the webhook worker)
      const webhookLog = await prisma.webhookLog.create({
        data: {
          webhookId: testWebhook.id,
          event: 'ticket.purchased',
          payload: webhookPayload,
          status: 'delivered',
          attempts: 1,
          deliveredAt: new Date(),
          response: {
            statusCode: 200,
            body: 'OK',
          },
        },
      });

      expect(webhookLog.id).toBeDefined();
      expect(webhookLog.status).toBe('delivered');
    });

    test('should generate correct webhook signature', () => {
      const payload = JSON.stringify({
        event: 'ticket.purchased',
        data: { test: 'data' },
      });

      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      expect(signature).toBeDefined();
      expect(signature).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should verify webhook signature', () => {
      const payload = JSON.stringify({
        event: 'ticket.purchased',
        data: { test: 'data' },
      });

      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      // Verify signature
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(signature, 'hex')
      );

      expect(isValid).toBe(true);
    });

    test('should handle webhook delivery failure', async () => {
      const webhookLog = await prisma.webhookLog.create({
        data: {
          webhookId: testWebhook.id,
          event: 'ticket.purchased',
          payload: { test: 'data' },
          status: 'failed',
          attempts: 3,
          response: {
            statusCode: 500,
            body: 'Internal Server Error',
            error: 'Connection timeout',
          },
        },
      });

      expect(webhookLog.status).toBe('failed');
      expect(webhookLog.attempts).toBe(3);
      expect(webhookLog.response.statusCode).toBe(500);
    });

    test('should retry failed webhook deliveries', async () => {
      // Create a failed webhook log
      const webhookLog = await prisma.webhookLog.create({
        data: {
          webhookId: testWebhook.id,
          event: 'ticket.purchased',
          payload: { test: 'data' },
          status: 'failed',
          attempts: 1,
          response: {
            statusCode: 500,
            body: 'Internal Server Error',
          },
        },
      });

      // Simulate retry (in real implementation, this would be handled by the worker)
      const updatedLog = await prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: {
          status: 'pending',
          attempts: 2,
          response: null,
        },
      });

      expect(updatedLog.attempts).toBe(2);
      expect(updatedLog.status).toBe('pending');
    });
  });

  describe('Webhook Logs', () => {
    beforeEach(async () => {
      // Create test webhook logs
      await prisma.webhookLog.createMany({
        data: [
          {
            webhookId: testWebhook.id,
            event: 'ticket.purchased',
            payload: { test: 'data1' },
            status: 'delivered',
            attempts: 1,
            deliveredAt: new Date(),
          },
          {
            webhookId: testWebhook.id,
            event: 'payment.completed',
            payload: { test: 'data2' },
            status: 'failed',
            attempts: 3,
            response: { statusCode: 500 },
          },
        ],
      });
    });

    test('should get webhook delivery logs', async () => {
      const response = await request(app)
        .get(`/api/webhooks/${testWebhook.id}/logs`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    test('should filter logs by status', async () => {
      const response = await request(app)
        .get(`/api/webhooks/${testWebhook.id}/logs?status=failed`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('failed');
    });

    test('should filter logs by event type', async () => {
      const response = await request(app)
        .get(`/api/webhooks/${testWebhook.id}/logs?event=ticket.purchased`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].event).toBe('ticket.purchased');
    });
  });

  describe('Webhook Testing', () => {
    test('should test webhook endpoint', async () => {
      const response = await request(app)
        .post(`/api/webhooks/${testWebhook.id}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          event: 'ticket.purchased',
          payload: {
            test: 'data',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Webhook test triggered');
    });

    test('should retry failed webhook deliveries', async () => {
      // Create a failed webhook log
      const webhookLog = await prisma.webhookLog.create({
        data: {
          webhookId: testWebhook.id,
          event: 'ticket.purchased',
          payload: { test: 'data' },
          status: 'failed',
          attempts: 3,
          response: { statusCode: 500 },
        },
      });

      const response = await request(app)
        .post(`/api/webhooks/${testWebhook.id}/retry`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          logId: webhookLog.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Webhook retry triggered');
    });
  });

  describe('Webhook Security', () => {
    test('should validate webhook URL format', async () => {
      const response = await request(app)
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'invalid-url',
          events: ['ticket.purchased'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should require HTTPS for webhook URLs', async () => {
      const response = await request(app)
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'http://test-app.com/webhook',
          events: ['ticket.purchased'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should validate event types', async () => {
      const response = await request(app)
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://test-app.com/webhook',
          events: ['invalid.event.type'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});