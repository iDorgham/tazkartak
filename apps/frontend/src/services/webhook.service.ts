import apiClient from './api.service';

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  retryConfig: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialIntervalSeconds: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  event: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  response: any;
  deliveredAt: string | null;
  createdAt: string;
}

export interface WebhookStats {
  totalWebhooks: number;
  activeWebhooks: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
}

export interface CreateWebhookData {
  url: string;
  events: string[];
  retryConfig?: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialIntervalSeconds: number;
  };
}

export interface UpdateWebhookData {
  url?: string;
  events?: string[];
  isActive?: boolean;
  retryConfig?: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialIntervalSeconds: number;
  };
}

export interface WebhookResponse {
  status: string;
  data: Webhook;
  message?: string;
}

export interface WebhooksResponse {
  status: string;
  data: Webhook[];
  message?: string;
}

export interface WebhookLogsResponse {
  status: string;
  data: WebhookLog[];
  message?: string;
}

export interface WebhookStatsResponse {
  status: string;
  data: WebhookStats;
  message?: string;
}

class WebhookService {
  private baseUrl = '/api/webhooks';

  /**
   * Get all webhooks for the authenticated organizer
   */
  async getWebhooks(): Promise<WebhooksResponse> {
    const response = await apiClient.get(`${this.baseUrl}/manage`);
    return response.data;
  }

  /**
   * Get a specific webhook by ID
   */
  async getWebhookById(id: string): Promise<WebhookResponse> {
    const response = await apiClient.get(`${this.baseUrl}/manage/${id}`);
    return response.data;
  }

  /**
   * Create a new webhook
   */
  async createWebhook(data: CreateWebhookData): Promise<WebhookResponse> {
    const response = await apiClient.post(`${this.baseUrl}/manage`, data);
    return response.data;
  }

  /**
   * Update an existing webhook
   */
  async updateWebhook(id: string, data: UpdateWebhookData): Promise<WebhookResponse> {
    const response = await apiClient.put(`${this.baseUrl}/manage/${id}`, data);
    return response.data;
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/manage/${id}`);
  }

  /**
   * Test a webhook by sending a test event
   */
  async testWebhook(id: string): Promise<{ status: string; message: string }> {
    const response = await apiClient.post(`${this.baseUrl}/manage/${id}/test`);
    return response.data;
  }

  /**
   * Get webhook logs
   */
  async getWebhookLogs(webhookId: string): Promise<WebhookLogsResponse> {
    const response = await apiClient.get(`${this.baseUrl}/manage/${webhookId}/logs`);
    return response.data;
  }

  /**
   * Retry a failed webhook delivery
   */
  async retryWebhookDelivery(webhookId: string, logId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/manage/${webhookId}/retry`, { logId });
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(): Promise<WebhookStatsResponse> {
    const response = await apiClient.get(`${this.baseUrl}/manage/stats`);
    return response.data;
  }

  /**
   * Get valid webhook events
   */
  async getValidEvents(): Promise<{ status: string; data: string[] }> {
    const response = await apiClient.get(`${this.baseUrl}/manage/events`);
    return response.data;
  }

  /**
   * Get available webhook events with descriptions
   */
  getAvailableEvents(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'ticket.purchased',
        label: 'Ticket Purchased',
        description: 'Triggered when a ticket is successfully purchased',
      },
      {
        value: 'ticket.scanned',
        label: 'Ticket Scanned',
        description: 'Triggered when a ticket QR code is scanned for entry',
      },
      {
        value: 'ticket.refunded',
        label: 'Ticket Refunded',
        description: 'Triggered when a ticket is refunded',
      },
      {
        value: 'event.created',
        label: 'Event Created',
        description: 'Triggered when a new event is created',
      },
      {
        value: 'event.updated',
        label: 'Event Updated',
        description: 'Triggered when an event is modified',
      },
      {
        value: 'event.cancelled',
        label: 'Event Cancelled',
        description: 'Triggered when an event is cancelled',
      },
      {
        value: 'payment.completed',
        label: 'Payment Completed',
        description: 'Triggered when a payment is successfully processed',
      },
      {
        value: 'payment.failed',
        label: 'Payment Failed',
        description: 'Triggered when a payment fails',
      },
    ];
  }

  /**
   * Get default retry configuration
   */
  getDefaultRetryConfig() {
    return {
      maxAttempts: 5,
      backoffMultiplier: 2,
      initialIntervalSeconds: 60,
    };
  }

  /**
   * Validate webhook URL
   */
  validateWebhookUrl(url: string): { isValid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
        return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
      }
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Validate webhook data
   */
  validateWebhookData(data: CreateWebhookData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.url || data.url.trim().length === 0) {
      errors.push('Webhook URL is required');
    } else {
      const urlValidation = this.validateWebhookUrl(data.url);
      if (!urlValidation.isValid) {
        errors.push(urlValidation.error || 'Invalid URL');
      }
    }

    if (!data.events || data.events.length === 0) {
      errors.push('At least one event must be selected');
    }

    const availableEvents = this.getAvailableEvents().map(e => e.value);
    const invalidEvents = data.events.filter(event => !availableEvents.includes(event));
    if (invalidEvents.length > 0) {
      errors.push(`Invalid events: ${invalidEvents.join(', ')}`);
    }

    if (data.retryConfig) {
      if (data.retryConfig.maxAttempts < 1 || data.retryConfig.maxAttempts > 10) {
        errors.push('Max attempts must be between 1 and 10');
      }
      if (data.retryConfig.backoffMultiplier < 1 || data.retryConfig.backoffMultiplier > 5) {
        errors.push('Backoff multiplier must be between 1 and 5');
      }
      if (data.retryConfig.initialIntervalSeconds < 1 || data.retryConfig.initialIntervalSeconds > 3600) {
        errors.push('Initial interval must be between 1 and 3600 seconds');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get webhook status color
   */
  getStatusColor(status: string): 'success' | 'error' | 'warning' | 'default' {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  }

  /**
   * Get webhook status icon
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'delivered':
        return 'check_circle';
      case 'failed':
        return 'error';
      case 'pending':
        return 'schedule';
      default:
        return 'info';
    }
  }

  /**
   * Format webhook log payload for display
   */
  formatPayload(payload: any): string {
    try {
      return JSON.stringify(payload, null, 2);
    } catch (error) {
      return String(payload);
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  /**
   * Format relative time
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  /**
   * Get retry configuration suggestions
   */
  getRetryConfigSuggestions(): Array<{ value: any; label: string; description: string }> {
    return [
      {
        value: { maxAttempts: 3, backoffMultiplier: 2, initialIntervalSeconds: 30 },
        label: 'Quick Retry',
        description: '3 attempts, 30s initial delay, 2x backoff',
      },
      {
        value: { maxAttempts: 5, backoffMultiplier: 2, initialIntervalSeconds: 60 },
        label: 'Standard Retry',
        description: '5 attempts, 60s initial delay, 2x backoff',
      },
      {
        value: { maxAttempts: 10, backoffMultiplier: 1.5, initialIntervalSeconds: 120 },
        label: 'Persistent Retry',
        description: '10 attempts, 120s initial delay, 1.5x backoff',
      },
    ];
  }

  /**
   * Generate webhook test payload
   */
  generateTestPayload(): any {
    return {
      id: `test_${Date.now()}`,
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        message: 'This is a test webhook from Tazkartak platform',
        test: true,
        webhookId: 'test-webhook',
        organizerId: 'test-organizer',
      },
    };
  }

  /**
   * Check if webhook URL is secure (HTTPS)
   */
  isSecureUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get webhook health status
   */
  async getWebhookHealth(webhookId: string): Promise<{ status: string; lastDelivery: string | null; successRate: number }> {
    try {
      const logsResponse = await this.getWebhookLogs(webhookId);
      const logs = logsResponse.data;
      
      if (logs.length === 0) {
        return { status: 'unknown', lastDelivery: null, successRate: 0 };
      }

      const recentLogs = logs.slice(0, 10); // Last 10 deliveries
      const successfulDeliveries = recentLogs.filter(log => log.status === 'delivered').length;
      const successRate = (successfulDeliveries / recentLogs.length) * 100;
      const lastDelivery = recentLogs[0]?.deliveredAt || null;

      let status = 'healthy';
      if (successRate < 50) status = 'unhealthy';
      else if (successRate < 80) status = 'warning';

      return { status, lastDelivery, successRate };
    } catch (error) {
      return { status: 'error', lastDelivery: null, successRate: 0 };
    }
  }
}

export const webhookService = new WebhookService();
