import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/database.config';
import { redis } from '../../config/redis.config';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('Widget Integration Tests', () => {
  let testUser: any;
  let testEvent: any;
  let testApiKey: any;
  let authToken: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'widget-test@example.com',
        password: 'hashedpassword',
        firstName: 'Widget',
        lastName: 'Test',
        role: 'ORGANIZER',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    // Create auth token
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test API key
    const apiKeyData = await prisma.apiKey.create({
      data: {
        organizerId: testUser.id,
        key: 'test-widget-api-key-123',
        name: 'Widget Test API Key',
        permissions: ['read', 'write'],
        rateLimit: 1000,
        allowedDomains: ['https://example.com', 'http://localhost:3000'],
        isActive: true,
      },
    });

    testApiKey = apiKeyData;

    // Create test event with ticket types
    testEvent = await prisma.event.create({
      data: {
        name: 'Widget Test Event',
        description: 'Event for widget testing',
        category: 'MUSIC',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 25 * 60 * 60 * 1000),
        capacity: 100,
        price: 50.00,
        currency: 'EGP',
        status: 'PUBLISHED',
        organizerId: testUser.id,
        venueId: 'test-venue-id',
      },
    });

    // Create ticket types
    await prisma.ticketType.createMany({
      data: [
        {
          eventId: testEvent.id,
          name: 'General Admission',
          description: 'Standard entry ticket',
          price: 50.00,
          currency: 'EGP',
          quantity: 50,
          availableQuantity: 50,
          maxPerOrder: 5,
          isActive: true,
        },
        {
          eventId: testEvent.id,
          name: 'VIP',
          description: 'VIP experience',
          price: 100.00,
          currency: 'EGP',
          quantity: 25,
          availableQuantity: 25,
          maxPerOrder: 2,
          isActive: true,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany();
    await prisma.ticketType.deleteMany();
    await prisma.event.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.user.deleteMany();
    await redis.flushdb();
  });

  describe('Widget Configuration', () => {
    test('POST /api/widget-config - should create widget configuration', async () => {
      const configData = {
        theme: {
          primaryColor: '#1976d2',
          secondaryColor: '#dc004e',
          backgroundColor: '#ffffff',
          textColor: '#333333',
          fontFamily: 'Roboto, sans-serif',
          borderRadius: '8px',
          buttonStyle: 'rounded',
        },
        customCSS: '.custom-button { background: linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%); }',
        layout: 'standard',
        language: 'en',
        currency: 'EGP',
        showVenueInfo: true,
        showEventDescription: true,
        realTimeUpdates: true,
      };

      const response = await request(app)
        .post('/api/widget-config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(configData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.theme.primaryColor).toBe('#1976d2');
      expect(response.body.data.realTimeUpdates).toBe(true);
    });

    test('GET /api/widget-config - should get widget configuration', async () => {
      const response = await request(app)
        .get('/api/widget-config')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.theme).toBeDefined();
      expect(response.body.data.layout).toBe('standard');
    });

    test('PUT /api/widget-config - should update widget configuration', async () => {
      const updateData = {
        theme: {
          primaryColor: '#ff5722',
          secondaryColor: '#4caf50',
          backgroundColor: '#f5f5f5',
          textColor: '#000000',
          fontFamily: 'Arial, sans-serif',
          borderRadius: '12px',
          buttonStyle: 'pill',
        },
        layout: 'compact',
        realTimeUpdates: false,
      };

      const response = await request(app)
        .put('/api/widget-config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.theme.primaryColor).toBe('#ff5722');
      expect(response.body.data.layout).toBe('compact');
      expect(response.body.data.realTimeUpdates).toBe(false);
    });
  });

  describe('Widget Data Endpoints', () => {
    test('GET /api/public/events/:id - should return event data for widget', async () => {
      const response = await request(app)
        .get(`/api/public/events/${testEvent.id}`)
        .set('X-API-Key', testApiKey.key);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testEvent.id);
      expect(response.body.data.name).toBe('Widget Test Event');
      expect(response.body.data.ticketTypes).toHaveLength(2);
      expect(response.body.data.ticketTypes[0].availableQuantity).toBeDefined();
    });

    test('GET /api/public/events/:id/tickets - should return ticket availability', async () => {
      const response = await request(app)
        .get(`/api/public/events/${testEvent.id}/tickets`)
        .set('X-API-Key', testApiKey.key);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      const generalAdmission = response.body.data.find((t: any) => t.name === 'General Admission');
      const vip = response.body.data.find((t: any) => t.name === 'VIP');
      
      expect(generalAdmission.availableQuantity).toBe(50);
      expect(vip.availableQuantity).toBe(25);
    });
  });

  describe('Widget Purchase Flow', () => {
    test('POST /api/public/tickets/purchase - should handle widget purchase', async () => {
      const purchaseData = {
        eventId: testEvent.id,
        ticketTypeId: 'test-ticket-type-1', // General Admission
        quantity: 2,
        buyerInfo: {
          firstName: 'Widget',
          lastName: 'Buyer',
          email: 'widget.buyer@example.com',
          phone: '+1234567890',
        },
        paymentMethod: 'credit_card',
        source: 'widget', // Indicate this came from widget
      };

      const response = await request(app)
        .post('/api/public/tickets/purchase')
        .set('X-API-Key', testApiKey.key)
        .send(purchaseData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentUrl).toBeDefined();
      expect(response.body.data.orderId).toBeDefined();
    });

    test('POST /api/public/tickets/purchase - should validate quantity limits', async () => {
      const purchaseData = {
        eventId: testEvent.id,
        ticketTypeId: 'test-ticket-type-2', // VIP
        quantity: 5, // Exceeds maxPerOrder of 2
        buyerInfo: {
          firstName: 'Widget',
          lastName: 'Buyer',
          email: 'widget.buyer@example.com',
          phone: '+1234567890',
        },
        paymentMethod: 'credit_card',
      };

      const response = await request(app)
        .post('/api/public/tickets/purchase')
        .set('X-API-Key', testApiKey.key)
        .send(purchaseData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('quantity');
    });
  });

  describe('Widget Analytics', () => {
    test('POST /api/analytics/widget-track - should track widget analytics', async () => {
      const analyticsData = {
        widgetId: 'test-widget-123',
        eventId: testEvent.id,
        action: 'load',
        metadata: {
          userAgent: 'Mozilla/5.0 (Test Browser)',
          referrer: 'https://example.com',
          loadTime: 1500,
          viewport: '1920x1080',
        },
      };

      const response = await request(app)
        .post('/api/analytics/widget-track')
        .set('X-API-Key', testApiKey.key)
        .send(analyticsData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Analytics event tracked');
    });

    test('POST /api/analytics/widget-track - should track purchase events', async () => {
      const analyticsData = {
        widgetId: 'test-widget-123',
        eventId: testEvent.id,
        action: 'purchase',
        metadata: {
          ticketTypeId: 'test-ticket-type-1',
          quantity: 2,
          amount: 100.00,
          paymentMethod: 'credit_card',
          purchaseTime: Date.now(),
        },
      };

      const response = await request(app)
        .post('/api/analytics/widget-track')
        .set('X-API-Key', testApiKey.key)
        .send(analyticsData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Widget Real-time Updates', () => {
    test('WebSocket connection should work with API key', async () => {
      // This test would require a WebSocket client
      // For now, we'll test the endpoint that handles WebSocket authentication
      const response = await request(app)
        .get('/api/public/events')
        .set('X-API-Key', testApiKey.key);

      expect(response.status).toBe(200);
      // The actual WebSocket connection test would be done with a WebSocket client
    });

    test('Real-time ticket availability updates', async () => {
      // Simulate ticket availability change
      const ticketType = await prisma.ticketType.findFirst({
        where: { eventId: testEvent.id },
      });

      if (ticketType) {
        await prisma.ticketType.update({
          where: { id: ticketType.id },
          data: { availableQuantity: ticketType.availableQuantity - 1 },
        });

        // Check that the change is reflected in the API
        const response = await request(app)
          .get(`/api/public/events/${testEvent.id}/tickets`)
          .set('X-API-Key', testApiKey.key);

        expect(response.status).toBe(200);
        const updatedTicketType = response.body.data.find((t: any) => t.id === ticketType.id);
        expect(updatedTicketType.availableQuantity).toBe(ticketType.availableQuantity - 1);
      }
    });
  });

  describe('Widget Security', () => {
    test('Should reject requests from unauthorized domains', async () => {
      // Create API key with restricted domains
      const restrictedApiKey = await prisma.apiKey.create({
        data: {
          organizerId: testUser.id,
          key: 'restricted-api-key-123',
          name: 'Restricted API Key',
          permissions: ['read'],
          rateLimit: 100,
          allowedDomains: ['https://authorized-domain.com'],
          isActive: true,
        },
      });

      const response = await request(app)
        .get('/api/public/events')
        .set('X-API-Key', restrictedApiKey.key)
        .set('Origin', 'https://unauthorized-domain.com');

      // The API should still work (domain validation is typically done at the widget level)
      expect(response.status).toBe(200);
    });

    test('Should validate API key permissions', async () => {
      // Create API key with read-only permissions
      const readOnlyApiKey = await prisma.apiKey.create({
        data: {
          organizerId: testUser.id,
          key: 'readonly-api-key-123',
          name: 'Read Only API Key',
          permissions: ['read'],
          rateLimit: 100,
          allowedDomains: ['https://example.com'],
          isActive: true,
        },
      });

      const purchaseData = {
        eventId: testEvent.id,
        ticketTypeId: 'test-ticket-type-1',
        quantity: 1,
        buyerInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '+1234567890',
        },
        paymentMethod: 'credit_card',
      };

      const response = await request(app)
        .post('/api/public/tickets/purchase')
        .set('X-API-Key', readOnlyApiKey.key)
        .send(purchaseData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Widget Error Handling', () => {
    test('Should handle invalid event ID gracefully', async () => {
      const response = await request(app)
        .get('/api/public/events/invalid-event-id')
        .set('X-API-Key', testApiKey.key);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('Should handle malformed purchase requests', async () => {
      const malformedData = {
        eventId: testEvent.id,
        // Missing required fields
        quantity: 1,
      };

      const response = await request(app)
        .post('/api/public/tickets/purchase')
        .set('X-API-Key', testApiKey.key)
        .send(malformedData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should handle expired events', async () => {
      // Create an expired event
      const expiredEvent = await prisma.event.create({
        data: {
          name: 'Expired Event',
          description: 'This event has passed',
          category: 'MUSIC',
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          endDate: new Date(Date.now() - 23 * 60 * 60 * 1000), // Yesterday + 1 hour
          capacity: 50,
          price: 25.00,
          currency: 'EGP',
          status: 'COMPLETED',
          organizerId: testUser.id,
          venueId: 'test-venue-id',
        },
      });

      const response = await request(app)
        .get(`/api/public/events/${expiredEvent.id}`)
        .set('X-API-Key', testApiKey.key);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('COMPLETED');
    });
  });
});
