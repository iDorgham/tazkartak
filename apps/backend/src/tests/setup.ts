import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/tazkartak_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1';

// Global test setup
beforeAll(async () => {
  // Initialize test database and Redis connections
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Clean up test environment
  console.log('Cleaning up test environment...');
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidDate(): R;
      toBeValidEmail(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },
  
  toBeValidDate(received: string | Date) {
    const date = new Date(received);
    const pass = date instanceof Date && !isNaN(date.getTime());
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },
  
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },
});

// Test database utilities
export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export const testRedis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379/1');

// Helper functions for tests
export const cleanupTestData = async () => {
  await testDb.webhookLog.deleteMany();
  await testDb.webhook.deleteMany();
  await testDb.accessToken.deleteMany();
  await testDb.authorizationCode.deleteMany();
  await testDb.oAuthClient.deleteMany();
  await testDb.apiKey.deleteMany();
  await testDb.ticket.deleteMany();
  await testDb.ticketType.deleteMany();
  await testDb.event.deleteMany();
  await testDb.user.deleteMany();
  await testRedis.flushdb();
};

export const createTestUser = async (overrides = {}) => {
  return await testDb.user.create({
    data: {
      email: 'test@example.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'ORGANIZER',
      status: 'ACTIVE',
      emailVerified: true,
      ...overrides,
    },
  });
};

export const createTestEvent = async (organizerId: string, overrides = {}) => {
  return await testDb.event.create({
    data: {
      name: 'Test Event',
      description: 'Test event description',
      category: 'MUSIC',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 25 * 60 * 60 * 1000),
      capacity: 100,
      price: 50.00,
      currency: 'EGP',
      status: 'PUBLISHED',
      organizerId,
      venueId: 'test-venue-id',
      ...overrides,
    },
  });
};

export const createTestApiKey = async (organizerId: string, overrides = {}) => {
  return await testDb.apiKey.create({
    data: {
      organizerId,
      key: 'test-api-key-123',
      name: 'Test API Key',
      permissions: ['read', 'write'],
      rateLimit: 1000,
      allowedDomains: ['https://example.com'],
      isActive: true,
      ...overrides,
    },
  });
};

export const createTestWebhook = async (organizerId: string, overrides = {}) => {
  return await testDb.webhook.create({
    data: {
      organizerId,
      url: 'https://webhook.site/test',
      events: ['ticket.purchased', 'payment.completed'],
      secret: 'test-webhook-secret',
      isActive: true,
      retryConfig: {
        maxAttempts: 5,
        backoffMultiplier: 2,
      },
      ...overrides,
    },
  });
};

// Mock implementations for external services
export const mockExternalServices = () => {
  // Mock axios for webhook testing
  jest.mock('axios');
  
  // Mock email service
  jest.mock('../services/email.service', () => ({
    sendEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  }));
  
  // Mock payment gateways
  jest.mock('../services/paymob.service', () => ({
    paymobService: {
      createOrder: jest.fn().mockResolvedValue({
        id: 'test-order-id',
        paymentUrl: 'https://paymob.com/pay/test-order-id',
      }),
      verifyPayment: jest.fn().mockResolvedValue(true),
    },
  }));
  
  jest.mock('../services/fawry.service', () => ({
    fawryService: {
      createChargeRequest: jest.fn().mockResolvedValue({
        referenceNumber: 'test-ref-123',
        paymentUrl: 'https://fawry.com/pay/test-ref-123',
      }),
      verifyPayment: jest.fn().mockResolvedValue(true),
    },
  }));
};
