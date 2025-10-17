import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Test database configuration
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/tazkartak_test',
    },
  },
});

// Test Redis configuration
const testRedis = new Redis({
  host: process.env.TEST_REDIS_HOST || 'localhost',
  port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
  db: parseInt(process.env.TEST_REDIS_DB || '1'), // Use different DB for tests
});

// Test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  authToken: string;
}

export interface TestEvent {
  id: string;
  name: string;
  organizerId: string;
  venueId: string;
}

export interface TestVenue {
  id: string;
  name: string;
  ownerId: string;
}

export interface TestApiKey {
  id: string;
  key: string;
  organizerId: string;
  permissions: string[];
}

export interface TestOAuthClient {
  id: string;
  clientId: string;
  clientSecret: string;
  organizerId: string;
}

export interface TestWebhook {
  id: string;
  url: string;
  secret: string;
  organizerId: string;
}

export class TestSetup {
  private static instance: TestSetup;
  private testUsers: TestUser[] = [];
  private testEvents: TestEvent[] = [];
  private testVenues: TestVenue[] = [];
  private testApiKeys: TestApiKey[] = [];
  private testOAuthClients: TestOAuthClient[] = [];
  private testWebhooks: TestWebhook[] = [];

  static getInstance(): TestSetup {
    if (!TestSetup.instance) {
      TestSetup.instance = new TestSetup();
    }
    return TestSetup.instance;
  }

  async setupDatabase(): Promise<void> {
    try {
      // Connect to test database
      await testPrisma.$connect();
      console.log('✅ Test database connected');

      // Connect to test Redis
      await testRedis.ping();
      console.log('✅ Test Redis connected');

      // Clean up any existing test data
      await this.cleanup();
    } catch (error) {
      console.error('❌ Test setup failed:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Delete in reverse order of dependencies
      await testPrisma.webhookLog.deleteMany();
      await testPrisma.webhook.deleteMany();
      await testPrisma.accessToken.deleteMany();
      await testPrisma.authorizationCode.deleteMany();
      await testPrisma.oAuthClient.deleteMany();
      await testPrisma.apiKey.deleteMany();
      await testPrisma.ticketType.deleteMany();
      await testPrisma.ticket.deleteMany();
      await testPrisma.payment.deleteMany();
      await testPrisma.event.deleteMany();
      await testPrisma.venue.deleteMany();
      await testPrisma.user.deleteMany();

      // Clear Redis test database
      await testRedis.flushdb();

      // Clear test data arrays
      this.testUsers = [];
      this.testEvents = [];
      this.testVenues = [];
      this.testApiKeys = [];
      this.testOAuthClients = [];
      this.testWebhooks = [];

      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }

  async createTestUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    const userData = {
      email: `test-${Date.now()}@example.com`,
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'ORGANIZER',
      status: 'ACTIVE',
      emailVerified: true,
      ...overrides,
    };

    const user = await testPrisma.user.create({
      data: userData,
    });

    const authToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    const testUser = {
      id: user.id,
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      authToken,
    };

    this.testUsers.push(testUser);
    return testUser;
  }

  async createTestVenue(ownerId: string, overrides: Partial<TestVenue> = {}): Promise<TestVenue> {
    const venueData = {
      name: `Test Venue ${Date.now()}`,
      address: '123 Test Street',
      city: 'Test City',
      capacity: 1000,
      amenities: ['parking', 'wifi'],
      contactPerson: 'Test Contact',
      contactPhone: '+1234567890',
      contactEmail: 'venue@test.com',
      ownerId,
      isVerified: true,
      ...overrides,
    };

    const venue = await testPrisma.venue.create({
      data: venueData,
    });

    const testVenue = {
      id: venue.id,
      name: venue.name,
      ownerId: venue.ownerId,
    };

    this.testVenues.push(testVenue);
    return testVenue;
  }

  async createTestEvent(organizerId: string, venueId: string, overrides: Partial<TestEvent> = {}): Promise<TestEvent> {
    const eventData = {
      name: `Test Event ${Date.now()}`,
      description: 'A test event',
      category: 'MUSIC',
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 86400000 + 7200000),
      capacity: 500,
      price: 50.00,
      currency: 'EGP',
      status: 'PUBLISHED',
      organizerId,
      venueId,
      ...overrides,
    };

    const event = await testPrisma.event.create({
      data: eventData,
    });

    const testEvent = {
      id: event.id,
      name: event.name,
      organizerId: event.organizerId,
      venueId: event.venueId,
    };

    this.testEvents.push(testEvent);
    return testEvent;
  }

  async createTestApiKey(organizerId: string, overrides: Partial<TestApiKey> = {}): Promise<TestApiKey> {
    const apiKeyData = {
      key: `test-api-key-${Date.now()}`,
      name: 'Test API Key',
      permissions: ['read', 'write'],
      rateLimit: 1000,
      allowedDomains: ['https://test-app.com'],
      isActive: true,
      organizerId,
      ...overrides,
    };

    const apiKey = await testPrisma.apiKey.create({
      data: apiKeyData,
    });

    const testApiKey = {
      id: apiKey.id,
      key: apiKey.key,
      organizerId: apiKey.organizerId,
      permissions: apiKey.permissions,
    };

    this.testApiKeys.push(testApiKey);
    return testApiKey;
  }

  async createTestOAuthClient(organizerId: string, overrides: Partial<TestOAuthClient> = {}): Promise<TestOAuthClient> {
    const clientData = {
      clientId: `test-client-${Date.now()}`,
      clientSecret: crypto.createHash('sha256').update(`test-secret-${Date.now()}`).digest('hex'),
      name: 'Test OAuth Client',
      redirectUris: ['https://test-app.com/callback'],
      scopes: ['read', 'write'],
      isActive: true,
      organizerId,
      ...overrides,
    };

    const oauthClient = await testPrisma.oAuthClient.create({
      data: clientData,
    });

    const testOAuthClient = {
      id: oauthClient.id,
      clientId: oauthClient.clientId,
      clientSecret: 'original-secret', // Return original unhashed secret for testing
      organizerId: oauthClient.organizerId,
    };

    this.testOAuthClients.push(testOAuthClient);
    return testOAuthClient;
  }

  async createTestWebhook(organizerId: string, overrides: Partial<TestWebhook> = {}): Promise<TestWebhook> {
    const webhookData = {
      url: 'https://test-app.com/webhooks/tazkartak',
      events: ['ticket.purchased', 'payment.completed'],
      secret: crypto.randomBytes(32).toString('hex'),
      isActive: true,
      retryConfig: {
        maxAttempts: 3,
        backoffMultiplier: 2,
      },
      organizerId,
      ...overrides,
    };

    const webhook = await testPrisma.webhook.create({
      data: webhookData,
    });

    const testWebhook = {
      id: webhook.id,
      url: webhook.url,
      secret: webhook.secret,
      organizerId: webhook.organizerId,
    };

    this.testWebhooks.push(testWebhook);
    return testWebhook;
  }

  async createCompleteTestScenario(): Promise<{
    user: TestUser;
    venue: TestVenue;
    event: TestEvent;
    apiKey: TestApiKey;
    oauthClient: TestOAuthClient;
    webhook: TestWebhook;
  }> {
    const user = await this.createTestUser();
    const venue = await this.createTestVenue(user.id);
    const event = await this.createTestEvent(user.id, venue.id);
    const apiKey = await this.createTestApiKey(user.id);
    const oauthClient = await this.createTestOAuthClient(user.id);
    const webhook = await this.createTestWebhook(user.id);

    return {
      user,
      venue,
      event,
      apiKey,
      oauthClient,
      webhook,
    };
  }

  // Utility methods for testing
  generateWebhookSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  generateJWTToken(payload: any, expiresIn: string = '1h'): string {
    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: expiresIn });
  }

  async disconnect(): Promise<void> {
    await testPrisma.$disconnect();
    await testRedis.quit();
    console.log('✅ Test connections closed');
  }

  // Getters for test data
  getTestUsers(): TestUser[] {
    return this.testUsers;
  }

  getTestEvents(): TestEvent[] {
    return this.testEvents;
  }

  getTestVenues(): TestVenue[] {
    return this.testVenues;
  }

  getTestApiKeys(): TestApiKey[] {
    return this.testApiKeys;
  }

  getTestOAuthClients(): TestOAuthClient[] {
    return this.testOAuthClients;
  }

  getTestWebhooks(): TestWebhook[] {
    return this.testWebhooks;
  }
}

// Export singleton instance
export const testSetup = TestSetup.getInstance();

// Export database and Redis instances for direct access if needed
export { testPrisma, testRedis };
