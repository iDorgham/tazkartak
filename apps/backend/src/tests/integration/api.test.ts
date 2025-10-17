import request from 'supertest';
import { app } from '../../app';
import { PrismaClient } from '@prisma/client';
import { redis } from '../../config/redis.config';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Public API Integration Tests', () => {
  let testUser: any;
  let testEvent: any;
  let testApiKey: any;
  let testTicketType: any;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'api-test@example.com',
        password: 'hashedpassword',
        firstName: 'API',
        lastName: 'Test',
        role: 'ORGANIZER',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    // Create test venue
    const testVenue = await prisma.venue.create({
      data: {
        name: 'Test Venue',
        address: '123 Test Street',
        city: 'Test City',
        capacity: 1000,
        amenities: ['parking', 'wifi'],
        contactPerson: 'Test Contact',
        contactPhone: '+1234567890',
        contactEmail: 'venue@test.com',
        ownerId: testUser.id,
        isVerified: true,
      },
    });

    // Create test event
    testEvent = await prisma.event.create({
      data: {
        name: 'Test Event',
        description: 'A test event for API testing',
        category: 'MUSIC',
        startDate: new Date(Date.now() + 86400000), // Tomorrow
        endDate: new Date(Date.now() + 86400000 + 7200000), // Tomorrow + 2 hours
        capacity: 500,
        price: 50.00,
        currency: 'EGP',
        status: 'PUBLISHED',
        organizerId: testUser.id,
        venueId: testVenue.id,
      },
    });

    // Create test ticket type
    testTicketType = await prisma.ticketType.create({
      data: {
        eventId: testEvent.id,
        name: 'General Admission',
        description: 'Standard ticket',
        price: 50.00,
        currency: 'EGP',
        quantity: 100,
        availableQuantity: 100,
        maxPerOrder: 5,
        isActive: true,
      },
    });

    // Create test API key
    testApiKey = await prisma.apiKey.create({
      data: {
        organizerId: testUser.id,
        key: 'test-api-key-123',
        name: 'Test API Key',
        permissions: ['read', 'write'],
        rateLimit: 1000,
        allowedDomains: ['https://test-app.com'],
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.ticketType.deleteMany();
    await prisma.event.deleteMany();
    await prisma.venue.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('API Key Authentication', () => {
    test('should reject requests without API key', async () => {
      const response = await request(app)
        .get('/api/public/events');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    test('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .get('/api/public/events')
        .set('X-API-Key', 'invalid-key');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    test('should accept requests with valid API key', async () => {
      const response = await request(app)
        .get('/api/public/events')
        .set('X-API-Key', testApiKey.key);

      expect(response.status).toBe(200);
    });
  });

  describe('Public Events API', () => {
    test('should list public events', async () => {
      const response = await request(app)
        .get('/api/public/events')
        .set('X-API-Key', testApiKey.key);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toBe('Test Event');
    });

    test('should get event details', async () => {
      const response = await request(app)
        .get(`/api/public/events/${testEvent.id}`)
        .set('X-API-Key', testApiKey.key);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testEvent.id);
      expect(response.body.data.name).toBe('Test Event');
    });

    test('should get event ticket types', async () => {
      const response = await request(app)
        .get(`/api/public/events/${testEvent.id}/tickets`)
        .set('X-API-Key', testApiKey.key);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toBe('General Admission');
    });

    test('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/public/events/non-existent-id')
        .set('X-API-Key', testApiKey.key);

      expect(response.status).toBe(404);
    });
  });

  describe('Ticket Purchase API', () => {
    test('should purchase tickets successfully', async () => {
      const purchaseData = {
        eventId: testEvent.id,
        ticketTypeId: testTicketType.id,
        quantity: 2,
        buyerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
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

    test('should reject purchase with invalid quantity', async () => {
      const purchaseData = {
        eventId: testEvent.id,
        ticketTypeId: testTicketType.id,
        quantity: 0,
        buyerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
      };

      const response = await request(app)
        .post('/api/public/tickets/purchase')
        .set('X-API-Key', testApiKey.key)
        .send(purchaseData);

      expect(response.status).toBe(400);
    });

    test('should reject purchase with missing buyer info', async () => {
      const purchaseData = {
        eventId: testEvent.id,
        ticketTypeId: testTicketType.id,
        quantity: 2,
        buyerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          // Missing email and phone
        },
      };

      const response = await request(app)
        .post('/api/public/tickets/purchase')
        .set('X-API-Key', testApiKey.key)
        .send(purchaseData);

      expect(response.status).toBe(400);
    });
  });

  describe('QR Code Validation API', () => {
    test('should validate QR code successfully', async () => {
      // Create a test ticket with QR code
      const testTicket = await prisma.ticket.create({
        data: {
          eventId: testEvent.id,
          qrCode: 'test-qr-code-123',
          price: 50.00,
          currency: 'EGP',
          status: 'SOLD',
          purchaseDate: new Date(),
        },
      });

      const response = await request(app)
        .post('/api/public/qr/validate')
        .set('X-API-Key', testApiKey.key)
        .send({
          qrCode: 'test-qr-code-123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.ticketId).toBe(testTicket.id);
    });

    test('should reject invalid QR code', async () => {
      const response = await request(app)
        .post('/api/public/qr/validate')
        .set('X-API-Key', testApiKey.key)
        .send({
          qrCode: 'invalid-qr-code',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
    });
  });

  describe('API Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/public/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });

    test('should return API version', async () => {
      const response = await request(app)
        .get('/api/public/version');

      expect(response.status).toBe(200);
      expect(response.body.version).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits', async () => {
      // Create a low-rate-limit API key
      const limitedApiKey = await prisma.apiKey.create({
        data: {
          organizerId: testUser.id,
          key: 'limited-api-key',
          name: 'Limited API Key',
          permissions: ['read'],
          rateLimit: 2, // Very low limit
          allowedDomains: ['https://test-app.com'],
          isActive: true,
        },
      });

      // Make requests up to the limit
      await request(app)
        .get('/api/public/events')
        .set('X-API-Key', limitedApiKey.key);

      await request(app)
        .get('/api/public/events')
        .set('X-API-Key', limitedApiKey.key);

      // This should be rate limited
      const response = await request(app)
        .get('/api/public/events')
        .set('X-API-Key', limitedApiKey.key);

      expect(response.status).toBe(429);
      expect(response.headers['x-ratelimit-remaining']).toBe('0');

      // Cleanup
      await prisma.apiKey.delete({ where: { id: limitedApiKey.id } });
    });
  });

  describe('CORS and Headers', () => {
    test('should include proper CORS headers', async () => {
      const response = await request(app)
        .get('/api/public/events')
        .set('X-API-Key', testApiKey.key);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/public/events')
        .set('X-API-Key', testApiKey.key);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });
});