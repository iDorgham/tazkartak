import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError.util';
import { logger } from '../utils/logger.util';
import { redis } from '../config/redis.config';

const prisma = new PrismaClient();

export interface OAuthClient {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  scopes: string[];
  isActive: boolean;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scopes: string[];
  expiresAt: Date;
  used: boolean;
}

export interface AccessToken {
  token: string;
  refreshToken: string;
  clientId: string;
  userId: string;
  scopes: string[];
  expiresAt: Date;
  createdAt: Date;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface OAuthErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
}

export class OAuthService {
  private readonly CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes
  private readonly ACCESS_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour
  private readonly REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'oauth-secret';

  /**
   * Create OAuth client for an organizer
   */
  async createClient(
    organizerId: string,
    name: string,
    redirectUris: string[],
    scopes: string[] = ['read', 'write']
  ): Promise<OAuthClient> {
    try {
      const clientId = this.generateClientId();
      const clientSecret = this.generateClientSecret();

      const client = await prisma.oAuthClient.create({
        data: {
          name,
          clientId,
          clientSecret: this.hashSecret(clientSecret),
          redirectUris,
          scopes,
          organizerId,
          isActive: true,
        },
      });

      logger.info(`OAuth client created: ${clientId} for organizer ${organizerId}`);

      return {
        ...client,
        clientSecret, // Return unhashed secret for initial display
      } as OAuthClient;
    } catch (error: any) {
      logger.error('Failed to create OAuth client:', error);
      throw new AppError('Failed to create OAuth client', 500);
    }
  }

  /**
   * Get OAuth client by ID
   */
  async getClient(clientId: string): Promise<OAuthClient | null> {
    try {
      const client = await prisma.oAuthClient.findUnique({
        where: { clientId },
      });

      if (!client) return null;

      return client as OAuthClient;
    } catch (error: any) {
      logger.error('Failed to get OAuth client:', error);
      throw new AppError('Failed to get OAuth client', 500);
    }
  }

  /**
   * Validate OAuth client credentials
   */
  async validateClient(clientId: string, clientSecret?: string): Promise<boolean> {
    try {
      const client = await this.getClient(clientId);
      if (!client || !client.isActive) return false;

      if (clientSecret) {
        return this.verifySecret(clientSecret, client.clientSecret);
      }

      return true;
    } catch (error: any) {
      logger.error('Failed to validate OAuth client:', error);
      return false;
    }
  }

  /**
   * Generate authorization code
   */
  async generateAuthorizationCode(
    clientId: string,
    userId: string,
    redirectUri: string,
    scopes: string[]
  ): Promise<string> {
    try {
      const client = await this.getClient(clientId);
      if (!client) {
        throw new AppError('Invalid client ID', 400);
      }

      if (!client.redirectUris.includes(redirectUri)) {
        throw new AppError('Invalid redirect URI', 400);
      }

      const code = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + this.CODE_EXPIRY);

      // Store in Redis for fast access and automatic expiry
      const authCode: AuthorizationCode = {
        code,
        clientId,
        userId,
        redirectUri,
        scopes,
        expiresAt,
        used: false,
      };

      await redis.setex(
        `oauth:auth_code:${code}`,
        Math.floor(this.CODE_EXPIRY / 1000),
        JSON.stringify(authCode)
      );

      logger.info(`Authorization code generated for client ${clientId}, user ${userId}`);
      return code;
    } catch (error: any) {
      logger.error('Failed to generate authorization code:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<OAuthTokenResponse> {
    try {
      // Validate client
      const isValidClient = await this.validateClient(clientId, clientSecret);
      if (!isValidClient) {
        throw new AppError('Invalid client credentials', 401);
      }

      // Get and validate authorization code
      const authCodeStr = await redis.get(`oauth:auth_code:${code}`);
      if (!authCodeStr) {
        throw new AppError('Invalid or expired authorization code', 400);
      }

      const authCode: AuthorizationCode = JSON.parse(authCodeStr);
      
      if (authCode.used) {
        throw new AppError('Authorization code already used', 400);
      }

      if (authCode.clientId !== clientId) {
        throw new AppError('Invalid client ID for authorization code', 400);
      }

      if (authCode.redirectUri !== redirectUri) {
        throw new AppError('Invalid redirect URI', 400);
      }

      if (new Date() > authCode.expiresAt) {
        throw new AppError('Authorization code expired', 400);
      }

      // Mark code as used
      await redis.del(`oauth:auth_code:${code}`);

      // Generate tokens
      const accessToken = this.generateAccessToken(authCode.userId, authCode.scopes);
      const refreshToken = this.generateRefreshToken(authCode.userId, authCode.scopes);

      // Store tokens in database
      await prisma.accessToken.create({
        data: {
          token: this.hashToken(accessToken),
          refreshToken: this.hashToken(refreshToken),
          clientId,
          userId: authCode.userId,
          scopes: authCode.scopes,
          expiresAt: new Date(Date.now() + this.ACCESS_TOKEN_EXPIRY),
        },
      });

      logger.info(`Access token generated for user ${authCode.userId}, client ${clientId}`);

      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: Math.floor(this.ACCESS_TOKEN_EXPIRY / 1000),
        refresh_token: refreshToken,
        scope: authCode.scopes.join(' '),
      };
    } catch (error: any) {
      logger.error('Failed to exchange code for token:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    try {
      const tokenRecord = await prisma.accessToken.findFirst({
        where: {
          refreshToken: this.hashToken(refreshToken),
        },
        include: {
          oAuthClient: true,
        },
      });

      if (!tokenRecord) {
        throw new AppError('Invalid refresh token', 401);
      }

      if (!tokenRecord.oAuthClient.isActive) {
        throw new AppError('Client is inactive', 401);
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(tokenRecord.userId, tokenRecord.scopes);
      const newRefreshToken = this.generateRefreshToken(tokenRecord.userId, tokenRecord.scopes);

      // Update tokens in database
      await prisma.accessToken.update({
        where: { id: tokenRecord.id },
        data: {
          token: this.hashToken(newAccessToken),
          refreshToken: this.hashToken(newRefreshToken),
          expiresAt: new Date(Date.now() + this.ACCESS_TOKEN_EXPIRY),
        },
      });

      logger.info(`Access token refreshed for user ${tokenRecord.userId}`);

      return {
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: Math.floor(this.ACCESS_TOKEN_EXPIRY / 1000),
        refresh_token: newRefreshToken,
        scope: tokenRecord.scopes.join(' '),
      };
    } catch (error: any) {
      logger.error('Failed to refresh access token:', error);
      throw error;
    }
  }

  /**
   * Validate access token
   */
  async validateAccessToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
    scopes?: string[];
    clientId?: string;
  }> {
    try {
      // First verify JWT signature
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      // Then check if token exists in database
      const tokenRecord = await prisma.accessToken.findFirst({
        where: {
          token: this.hashToken(token),
        },
        include: {
          oAuthClient: true,
        },
      });

      if (!tokenRecord) {
        return { valid: false };
      }

      if (!tokenRecord.oAuthClient.isActive) {
        return { valid: false };
      }

      if (new Date() > tokenRecord.expiresAt) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: tokenRecord.userId,
        scopes: tokenRecord.scopes,
        clientId: tokenRecord.clientId,
      };
    } catch (error: any) {
      logger.error('Failed to validate access token:', error);
      return { valid: false };
    }
  }

  /**
   * Revoke access token
   */
  async revokeToken(token: string): Promise<void> {
    try {
      await prisma.accessToken.deleteMany({
        where: {
          OR: [
            { token: this.hashToken(token) },
            { refreshToken: this.hashToken(token) },
          ],
        },
      });

      logger.info('Access token revoked');
    } catch (error: any) {
      logger.error('Failed to revoke token:', error);
      throw new AppError('Failed to revoke token', 500);
    }
  }

  /**
   * List OAuth clients for an organizer
   */
  async getClientsByOrganizer(organizerId: string): Promise<OAuthClient[]> {
    try {
      const clients = await prisma.oAuthClient.findMany({
        where: { organizerId },
        orderBy: { createdAt: 'desc' },
      });

      return clients.map((client: any) => ({
        ...client,
        clientSecret: '[HIDDEN]', // Never return actual secret
      })) as OAuthClient[];
    } catch (error: any) {
      logger.error('Failed to get OAuth clients:', error);
      throw new AppError('Failed to get OAuth clients', 500);
    }
  }

  /**
   * Update OAuth client
   */
  async updateClient(
    clientId: string,
    organizerId: string,
    updates: Partial<Pick<OAuthClient, 'name' | 'redirectUris' | 'scopes' | 'isActive'>>
  ): Promise<OAuthClient> {
    try {
      const client = await prisma.oAuthClient.findFirst({
        where: { clientId, organizerId },
      });

      if (!client) {
        throw new AppError('OAuth client not found', 404);
      }

      const updatedClient = await prisma.oAuthClient.update({
        where: { id: client.id },
        data: {
          name: updates.name,
          redirectUris: updates.redirectUris,
          scopes: updates.scopes,
          isActive: updates.isActive,
        },
      });

      return {
        ...updatedClient,
        clientSecret: '[HIDDEN]',
      } as OAuthClient;
    } catch (error: any) {
      logger.error('Failed to update OAuth client:', error);
      throw error;
    }
  }

  /**
   * Delete OAuth client
   */
  async deleteClient(clientId: string, organizerId: string): Promise<void> {
    try {
      const client = await prisma.oAuthClient.findFirst({
        where: { clientId, organizerId },
      });

      if (!client) {
        throw new AppError('OAuth client not found', 404);
      }

      // Delete all associated tokens
      await prisma.accessToken.deleteMany({
        where: { clientId },
      });

      // Delete client
      await prisma.oAuthClient.delete({
        where: { id: client.id },
      });

      logger.info(`OAuth client deleted: ${clientId}`);
    } catch (error: any) {
      logger.error('Failed to delete OAuth client:', error);
      throw error;
    }
  }

  /**
   * Generate client ID
   */
  private generateClientId(): string {
    return `tazkartak_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate client secret
   */
  private generateClientSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash client secret
   */
  private hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  /**
   * Verify client secret
   */
  private verifySecret(secret: string, hashedSecret: string): boolean {
    return this.hashSecret(secret) === hashedSecret;
  }

  /**
   * Generate access token (JWT)
   */
  private generateAccessToken(userId: string, scopes: string[]): string {
    const payload = {
      sub: userId,
      scopes,
      type: 'access_token',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + this.ACCESS_TOKEN_EXPIRY) / 1000),
    };

    return jwt.sign(payload, this.JWT_SECRET);
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(userId: string, scopes: string[]): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash token for storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Get supported scopes
   */
  getSupportedScopes(): string[] {
    return [
      'read',
      'write',
      'events:read',
      'events:write',
      'tickets:read',
      'tickets:write',
      'analytics:read',
      'webhooks:read',
      'webhooks:write',
    ];
  }

  /**
   * Validate scopes
   */
  validateScopes(requestedScopes: string[]): boolean {
    const supportedScopes = this.getSupportedScopes();
    return requestedScopes.every(scope => supportedScopes.includes(scope));
  }
}

export const oauthService = new OAuthService();