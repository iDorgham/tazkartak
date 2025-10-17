import apiClient from './api.service';

export interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  rateLimit: number;
  allowedDomains: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  key?: string; // Only present when creating/rotating
}

export interface CreateApiKeyData {
  name: string;
  permissions: string[];
  allowedDomains: string[];
  rateLimit: number;
  expiresAt: string | null;
}

export interface UpdateApiKeyData {
  name?: string;
  permissions?: string[];
  allowedDomains?: string[];
  rateLimit?: number;
  expiresAt?: string | null;
  isActive?: boolean;
}

export interface ApiKeyResponse {
  status: string;
  data: ApiKey;
  message?: string;
}

export interface ApiKeysResponse {
  status: string;
  data: ApiKey[];
  message?: string;
}

class ApiKeyService {
  private baseUrl = '/api/api-keys';

  /**
   * Get all API keys for the authenticated organizer
   */
  async getApiKeys(): Promise<ApiKeysResponse> {
    const response = await apiClient.get(this.baseUrl);
    return response.data;
  }

  /**
   * Get a specific API key by ID
   */
  async getApiKeyById(id: string): Promise<ApiKeyResponse> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Create a new API key
   */
  async createApiKey(data: CreateApiKeyData): Promise<ApiKeyResponse> {
    const response = await apiClient.post(this.baseUrl, data);
    return response.data;
  }

  /**
   * Update an existing API key
   */
  async updateApiKey(id: string, data: UpdateApiKeyData): Promise<ApiKeyResponse> {
    const response = await apiClient.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Rotate an API key (generate new key)
   */
  async rotateApiKey(id: string): Promise<ApiKeyResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/rotate`);
    return response.data;
  }

  /**
   * Get available permissions
   */
  getAvailablePermissions(): Array<{ value: string; label: string; description: string }> {
    return [
      { 
        value: 'events:read', 
        label: 'Read Events', 
        description: 'View event information and details' 
      },
      { 
        value: 'events:write', 
        label: 'Write Events', 
        description: 'Create and modify events' 
      },
      { 
        value: 'tickets:read', 
        label: 'Read Tickets', 
        description: 'View ticket information and status' 
      },
      { 
        value: 'tickets:write', 
        label: 'Write Tickets', 
        description: 'Purchase and manage tickets' 
      },
      { 
        value: 'qr:validate', 
        label: 'Validate QR Codes', 
        description: 'Validate ticket QR codes for entry' 
      },
      { 
        value: 'analytics:read', 
        label: 'Read Analytics', 
        description: 'View analytics and reporting data' 
      },
      { 
        value: 'payments:read', 
        label: 'Read Payments', 
        description: 'View payment information and status' 
      },
      { 
        value: 'payments:write', 
        label: 'Write Payments', 
        description: 'Process payments and refunds' 
      },
    ];
  }

  /**
   * Get default permissions for new API keys
   */
  getDefaultPermissions(): string[] {
    return ['events:read', 'tickets:read', 'tickets:write', 'qr:validate'];
  }

  /**
   * Validate API key data
   */
  validateApiKeyData(data: CreateApiKeyData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('API key name is required');
    }

    if (data.name && data.name.length > 100) {
      errors.push('API key name must be less than 100 characters');
    }

    if (!data.permissions || data.permissions.length === 0) {
      errors.push('At least one permission must be selected');
    }

    if (data.rateLimit && (data.rateLimit < 1 || data.rateLimit > 10000)) {
      errors.push('Rate limit must be between 1 and 10,000 requests per hour');
    }

    if (data.allowedDomains) {
      const invalidDomains = data.allowedDomains.filter(domain => {
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return !domainRegex.test(domain);
      });

      if (invalidDomains.length > 0) {
        errors.push(`Invalid domain format: ${invalidDomains.join(', ')}`);
      }
    }

    if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
      errors.push('Expiration date must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format API key for display (mask most characters)
   */
  maskApiKey(key: string): string {
    if (!key || key.length < 8) return '••••••••';
    return `${key.substring(0, 8)}••••••••••••••••••••••••••••••••`;
  }

  /**
   * Check if API key is expired
   */
  isApiKeyExpired(apiKey: ApiKey): boolean {
    if (!apiKey.expiresAt) return false;
    return new Date(apiKey.expiresAt) < new Date();
  }

  /**
   * Check if API key is active and not expired
   */
  isApiKeyActive(apiKey: ApiKey): boolean {
    return apiKey.isActive && !this.isApiKeyExpired(apiKey);
  }

  /**
   * Get API key status
   */
  getApiKeyStatus(apiKey: ApiKey): 'active' | 'inactive' | 'expired' {
    if (!apiKey.isActive) return 'inactive';
    if (this.isApiKeyExpired(apiKey)) return 'expired';
    return 'active';
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  }

  /**
   * Format last used date
   */
  formatLastUsed(dateString: string | null): string {
    if (!dateString) return 'Never used';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  /**
   * Get permission label
   */
  getPermissionLabel(permission: string): string {
    const permissions = this.getAvailablePermissions();
    const perm = permissions.find(p => p.value === permission);
    return perm ? perm.label : permission;
  }

  /**
   * Get permission description
   */
  getPermissionDescription(permission: string): string {
    const permissions = this.getAvailablePermissions();
    const perm = permissions.find(p => p.value === permission);
    return perm ? perm.description : '';
  }

  /**
   * Copy API key to clipboard
   */
  async copyToClipboard(key: string): Promise<void> {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(key);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = key;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
  }

  /**
   * Generate API key name suggestions
   */
  generateNameSuggestions(): string[] {
    return [
      'Website Widget',
      'Mobile App',
      'Third-party Integration',
      'Event Management System',
      'Ticketing Platform',
      'Customer Portal',
      'Admin Dashboard',
      'Analytics Tool',
    ];
  }

  /**
   * Get rate limit suggestions
   */
  getRateLimitSuggestions(): Array<{ value: number; label: string; description: string }> {
    return [
      { value: 100, label: '100/hour', description: 'Low traffic websites' },
      { value: 500, label: '500/hour', description: 'Medium traffic websites' },
      { value: 1000, label: '1,000/hour', description: 'High traffic websites' },
      { value: 5000, label: '5,000/hour', description: 'Enterprise applications' },
      { value: 10000, label: '10,000/hour', description: 'Maximum allowed' },
    ];
  }

  /**
   * Validate domain format
   */
  validateDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain);
  }

  /**
   * Normalize domain (remove protocol and trailing slash)
   */
  normalizeDomain(domain: string): string {
    return domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .toLowerCase();
  }
}

export const apiKeyService = new ApiKeyService();
