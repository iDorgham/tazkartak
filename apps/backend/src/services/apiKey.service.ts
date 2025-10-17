import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AppError } from '../utils/appError.util';
import { logger } from '../utils/logger.util';

const prisma = new PrismaClient();

export interface ApiKey {
  id: string;
  organizerId: string;
  key: string;
  name: string;
  permissions: string[];
  rateLimit: number;
  allowedDomains: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyData {
  organizerId: string;
  name: string;
  permissions?: string[];
  rateLimit?: number;
  allowedDomains?: string[];
  expiresAt?: Date;
}

export interface UpdateApiKeyData {
  name?: string;
  permissions?: string[];
  rateLimit?: number;
  allowedDomains?: string[];
  expiresAt?: Date;
  isActive?: boolean;
}

export interface ApiKeyUsage {
  keyId: string;
  requests: number;
  lastUsed: Date;
  dailyUsage: number;
  monthlyUsage: number;
}

export class ApiKeyService {
  private readonly API_KEY_PREFIX = 'tk_';
  private readonly API_KEY_LENGTH = 32;
  private readonly HASH_ALGORITHM = 'sha256';

  /**
   * Generate a new API key
   */
  private generateApiKey(): string {
    const randomBytes = crypto.randomBytes(this.API_KEY_LENGTH);
    const key = this.API_KEY_PREFIX + randomBytes.toString('hex');
    return key;
  }

  /**
   * Hash API key for storage
   */
  private hashApiKey(key: string): string {
    return crypto.createHash(this.HASH_ALGORITHM).update(key).digest('hex');
  }

  /**
   * Verify API key against hash
   */
  private verifyApiKey(key: string, hash: string): boolean {
    const keyHash = this.hashApiKey(key);
    return crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(hash));
  }

  /**
   * Create a new API key
   */
  async createApiKey(data: CreateApiKeyData): Promise<{ apiKey: ApiKey; plainKey: string }> {
    try {
      // Validate organizer exists
      const organizer = await prisma.organizer.findUnique({
        where: { userId: data.organizerId }
      });

      if (!organizer) {
        throw new AppError('Organizer not found', 404);
      }

      // Generate API key
      const plainKey = this.generateApiKey();
      const hashedKey = this.hashApiKey(plainKey);

      // Validate permissions
      const validPermissions = this.getValidPermissions();
      const permissions = data.permissions?.filter(p => validPermissions.includes(p)) || [];

      // Validate domains
      const allowedDomains = data.allowedDomains?.map(domain => {
        try {
          new URL(domain.startsWith('http') ? domain : `https://${domain}`);
          return domain.replace(/^https?:\/\//, '');
        } catch {
          throw new AppError(`Invalid domain: ${domain}`, 400);
        }
      }) || [];

      // Create API key record
      const apiKey = await prisma.apiKey.create({
        data: {
          organizerId: data.organizerId,
          key: hashedKey,
          name: data.name,
          permissions,
          rateLimit: data.rateLimit || 1000,
          allowedDomains,
          expiresAt: data.expiresAt || null
        }
      });

      logger.info(`API key created for organizer ${data.organizerId}: ${apiKey.id}`);

      return {
        apiKey: apiKey as ApiKey,
        plainKey
      };
    } catch (error: any) {
      logger.error('Failed to create API key:', error);
      throw error;
    }
  }

  /**
   * Get API keys for an organizer
   */
  async getApiKeysByOrganizerId(organizerId: string): Promise<ApiKey[]> {
    try {
      const apiKeys = await prisma.apiKey.findMany({
        where: { organizerId },
        orderBy: { createdAt: 'desc' }
      });

      return apiKeys.map(key => ({
        ...key,
        key: '***masked***' // Never return the actual key
      })) as ApiKey[];
    } catch (error: any) {
      logger.error('Failed to get API keys:', error);
      throw error;
    }
  }

  /**
   * Get API key by ID
   */
  async getApiKeyById(id: string, organizerId: string): Promise<ApiKey | null> {
    try {
      const apiKey = await prisma.apiKey.findFirst({
        where: { id, organizerId }
      });

      if (apiKey) {
        return {
          ...apiKey,
          key: '***masked***'
        } as ApiKey;
      }

      return null;
    } catch (error: any) {
      logger.error('Failed to get API key:', error);
      throw error;
    }
  }

  /**
   * Update API key
   */
  async updateApiKey(id: string, organizerId: string, data: UpdateApiKeyData): Promise<ApiKey> {
    try {
      const existingKey = await prisma.apiKey.findFirst({
        where: { id, organizerId }
      });

      if (!existingKey) {
        throw new AppError('API key not found', 404);
      }

      const updateData: any = {};

      if (data.name) {
        updateData.name = data.name;
      }

      if (data.permissions) {
        const validPermissions = this.getValidPermissions();
        updateData.permissions = data.permissions.filter(p => validPermissions.includes(p));
      }

      if (data.rateLimit !== undefined) {
        updateData.rateLimit = data.rateLimit;
      }

      if (data.allowedDomains) {
        updateData.allowedDomains = data.allowedDomains.map(domain => {
          try {
            new URL(domain.startsWith('http') ? domain : `https://${domain}`);
            return domain.replace(/^https?:\/\//, '');
          } catch {
            throw new AppError(`Invalid domain: ${domain}`, 400);
          }
        });
      }

      if (data.expiresAt !== undefined) {
        updateData.expiresAt = data.expiresAt;
      }

      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }

      const updatedKey = await prisma.apiKey.update({
        where: { id },
        data: updateData
      });

      logger.info(`API key updated: ${id}`);

      return {
        ...updatedKey,
        key: '***masked***'
      } as ApiKey;
    } catch (error: any) {
      logger.error('Failed to update API key:', error);
      throw error;
    }
  }

  /**
   * Delete API key
   */
  async deleteApiKey(id: string, organizerId: string): Promise<void> {
    try {
      const existingKey = await prisma.apiKey.findFirst({
        where: { id, organizerId }
      });

      if (!existingKey) {
        throw new AppError('API key not found', 404);
      }

      await prisma.apiKey.delete({
        where: { id }
      });

      logger.info(`API key deleted: ${id}`);
    } catch (error: any) {
      logger.error('Failed to delete API key:', error);
      throw error;
    }
  }

  /**
   * Rotate API key (create new, deactivate old)
   */
  async rotateApiKey(id: string, organizerId: string): Promise<{ apiKey: ApiKey; plainKey: string }> {
    try {
      const existingKey = await prisma.apiKey.findFirst({
        where: { id, organizerId }
      });

      if (!existingKey) {
        throw new AppError('API key not found', 404);
      }

      // Deactivate old key
      await prisma.apiKey.update({
        where: { id },
        data: { isActive: false }
      });

      // Create new key with same permissions
      const newKey = await this.createApiKey({
        organizerId,
        name: `${existingKey.name} (Rotated)`,
        permissions: existingKey.permissions,
        rateLimit: existingKey.rateLimit,
        allowedDomains: existingKey.allowedDomains,
        expiresAt: existingKey.expiresAt
      });

      logger.info(`API key rotated: ${id} -> ${newKey.apiKey.id}`);

      return newKey;
    } catch (error: any) {
      logger.error('Failed to rotate API key:', error);
      throw error;
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(key: string): Promise<{ isValid: boolean; apiKey?: ApiKey; error?: string }> {
    try {
      if (!key.startsWith(this.API_KEY_PREFIX)) {
        return { isValid: false, error: 'Invalid API key format' };
      }

      const hashedKey = this.hashApiKey(key);

      const apiKey = await prisma.apiKey.findFirst({
        where: {
          key: hashedKey,
          isActive: true
        }
      });

      if (!apiKey) {
        return { isValid: false, error: 'Invalid API key' };
      }

      // Check expiration
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return { isValid: false, error: 'API key has expired' };
      }

      // Update last used timestamp
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() }
      });

      return {
        isValid: true,
        apiKey: apiKey as ApiKey
      };
    } catch (error: any) {
      logger.error('Failed to validate API key:', error);
      return { isValid: false, error: 'Internal error' };
    }
  }

  /**
   * Check if API key has permission
   */
  async hasPermission(key: string, permission: string): Promise<boolean> {
    const validation = await this.validateApiKey(key);
    
    if (!validation.isValid || !validation.apiKey) {
      return false;
    }

    return validation.apiKey.permissions.includes(permission) || 
           validation.apiKey.permissions.includes('*');
  }

  /**
   * Check if domain is allowed for API key
   */
  async isDomainAllowed(key: string, domain: string): Promise<boolean> {
    const validation = await this.validateApiKey(key);
    
    if (!validation.isValid || !validation.apiKey) {
      return false;
    }

    // If no domains specified, allow all
    if (validation.apiKey.allowedDomains.length === 0) {
      return true;
    }

    const cleanDomain = domain.replace(/^https?:\/\//, '');
    return validation.apiKey.allowedDomains.includes(cleanDomain);
  }

  /**
   * Get API key usage statistics
   */
  async getApiKeyUsage(keyId: string): Promise<ApiKeyUsage> {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: keyId }
      });

      if (!apiKey) {
        throw new AppError('API key not found', 404);
      }

      // This would typically come from a usage tracking system
      // For now, return mock data
      return {
        keyId,
        requests: 0,
        lastUsed: apiKey.lastUsedAt || apiKey.createdAt,
        dailyUsage: 0,
        monthlyUsage: 0
      };
    } catch (error: any) {
      logger.error('Failed to get API key usage:', error);
      throw error;
    }
  }

  /**
   * Get valid permissions
   */
  getValidPermissions(): string[] {
    return [
      'events:read',
      'events:write',
      'tickets:read',
      'tickets:write',
      'payments:read',
      'payments:write',
      'analytics:read',
      'webhooks:read',
      'webhooks:write',
      '*' // Admin permission
    ];
  }

  /**
   * Get API key statistics for organizer
   */
  async getApiKeyStats(organizerId: string): Promise<{
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    totalRequests: number;
  }> {
    try {
      const keys = await prisma.apiKey.findMany({
        where: { organizerId }
      });

      const now = new Date();
      const activeKeys = keys.filter(k => k.isActive && (!k.expiresAt || k.expiresAt > now));
      const expiredKeys = keys.filter(k => k.expiresAt && k.expiresAt <= now);

      return {
        totalKeys: keys.length,
        activeKeys: activeKeys.length,
        expiredKeys: expiredKeys.length,
        totalRequests: 0 // Would come from usage tracking
      };
    } catch (error: any) {
      logger.error('Failed to get API key stats:', error);
      throw error;
    }
  }
}

export const apiKeyService = new ApiKeyService();
