import request from 'supertest';
import { app } from '../../app';
import { PrismaClient } from '@prisma/client';
import { redis } from '../../config/redis.config';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('OAuth 2.0 Integration Tests', () => {
  let testUser: any;
  let testClient: any;
  let authToken: string;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'oauth-test@example.com',
        password: 'hashedpassword',
        firstName: 'OAuth',
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
  });

  afterAll(async () => {
    // Cleanup
    await prisma.accessToken.deleteMany();
    await prisma.authorizationCode.deleteMany();
    await prisma.oAuthClient.deleteMany();
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('OAuth Client Management', () => {
    test('should create OAuth client', async () => {
      const response = await request(app)
        .post('/api/oauth/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Client',
          redirectUris: ['https://test-app.com/callback'],
          scopes: ['read', 'write'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Client');
      expect(response.body.data.clientId).toBeDefined();
      expect(response.body.data.clientSecret).toBeDefined();

      testClient = response.body.data;
    });

    test('should list OAuth clients', async () => {
      const response = await request(app)
        .get('/api/oauth/clients')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Test Client');
    });

    test('should update OAuth client', async () => {
      const response = await request(app)
        .put(`/api/oauth/clients/${testClient.clientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Client',
          scopes: ['read'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test Client');
      expect(response.body.data.scopes).toEqual(['read']);
    });

    test('should delete OAuth client', async () => {
      const response = await request(app)
        .delete(`/api/oauth/clients/${testClient.clientId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('OAuth Authorization Flow', () => {
    beforeEach(async () => {
      // Recreate test client for authorization tests
      testClient = await prisma.oAuthClient.create({
        data: {
          clientId: 'test-client-id',
          clientSecret: 'hashed-secret',
          name: 'Test Client',
          redirectUris: ['https://test-app.com/callback'],
          scopes: ['read', 'write'],
          organizerId: testUser.id,
          isActive: true,
        },
      });
    });

    test('should generate authorization code', async () => {
      const response = await request(app)
        .get('/api/oauth/authorize')
        .query({
          response_type: 'code',
          client_id: testClient.clientId,
          redirect_uri: 'https://test-app.com/callback',
          scope: 'read write',
          state: 'test-state',
        })
        .set('Cookie', `token=${authToken}`);

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('https://test-app.com/callback');
      expect(response.headers.location).toContain('code=');
      expect(response.headers.location).toContain('state=test-state');
    });

    test('should exchange authorization code for token', async () => {
      // First generate authorization code
      const authResponse = await request(app)
        .get('/api/oauth/authorize')
        .query({
          response_type: 'code',
          client_id: testClient.clientId,
          redirect_uri: 'https://test-app.com/callback',
          scope: 'read write',
        })
        .set('Cookie', `token=${authToken}`);

      const redirectUrl = new URL(authResponse.headers.location);
      const code = redirectUrl.searchParams.get('code');

      // Exchange code for token
      const tokenResponse = await request(app)
        .post('/api/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: code,
          client_id: testClient.clientId,
          client_secret: 'original-secret', // This would be the original unhashed secret
          redirect_uri: 'https://test-app.com/callback',
        });

      expect(tokenResponse.status).toBe(200);
      expect(tokenResponse.body.access_token).toBeDefined();
      expect(tokenResponse.body.token_type).toBe('Bearer');
      expect(tokenResponse.body.refresh_token).toBeDefined();
      expect(tokenResponse.body.expires_in).toBeDefined();
      expect(tokenResponse.body.scope).toBe('read write');
    });

    test('should refresh access token', async () => {
      // Create a test access token
      const accessToken = await prisma.accessToken.create({
        data: {
          token: 'hashed-access-token',
          refreshToken: 'hashed-refresh-token',
          clientId: testClient.clientId,
          userId: testUser.id,
          scopes: ['read', 'write'],
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
        },
      });

      const response = await request(app)
        .post('/api/oauth/token')
        .send({
          grant_type: 'refresh_token',
          refresh_token: 'original-refresh-token',
        });

      expect(response.status).toBe(200);
      expect(response.body.access_token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
    });

    test('should revoke token', async () => {
      const response = await request(app)
        .post('/api/oauth/revoke')
        .send({
          token: 'some-access-token',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should get supported scopes', async () => {
      const response = await request(app)
        .get('/api/oauth/scopes');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toContain('read');
      expect(response.body.data).toContain('write');
    });
  });

  describe('OAuth Error Handling', () => {
    test('should return error for invalid client ID', async () => {
      const response = await request(app)
        .get('/api/oauth/authorize')
        .query({
          response_type: 'code',
          client_id: 'invalid-client',
          redirect_uri: 'https://test-app.com/callback',
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error=server_error');
    });

    test('should return error for invalid redirect URI', async () => {
      const response = await request(app)
        .get('/api/oauth/authorize')
        .query({
          response_type: 'code',
          client_id: testClient.clientId,
          redirect_uri: 'https://invalid-app.com/callback',
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error=server_error');
    });

    test('should return error for invalid grant type', async () => {
      const response = await request(app)
        .post('/api/oauth/token')
        .send({
          grant_type: 'invalid_grant',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('invalid_request');
    });
  });
});
