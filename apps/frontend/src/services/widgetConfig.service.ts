import apiClient from './api.service';

export interface WidgetTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  buttonStyle: 'rounded' | 'square' | 'pill';
}

export interface WidgetSettings {
  showVenueInfo: boolean;
  showEventDescription: boolean;
  realtimeUpdates: boolean;
  showTicketTypes: boolean;
  showQuantitySelector: boolean;
  showDiscountCodes: boolean;
}

export interface WidgetConfig {
  id?: string;
  organizerId: string;
  theme: WidgetTheme;
  customCSS?: string;
  layout: 'compact' | 'standard' | 'expanded';
  language: string;
  currency: string;
  settings: WidgetSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface WidgetConfigResponse {
  status: string;
  data: WidgetConfig;
  message?: string;
}

class WidgetConfigService {
  private baseUrl = '/api/widget-config';

  /**
   * Get widget configuration for the authenticated organizer
   */
  async getWidgetConfig(): Promise<WidgetConfigResponse> {
    const response = await apiClient.get(this.baseUrl);
    return response.data;
  }

  /**
   * Create or update widget configuration
   */
  async createOrUpdateWidgetConfig(config: Partial<WidgetConfig>): Promise<WidgetConfigResponse> {
    const response = await apiClient.post(this.baseUrl, config);
    return response.data;
  }

  /**
   * Update widget configuration
   */
  async updateWidgetConfig(config: Partial<WidgetConfig>): Promise<WidgetConfigResponse> {
    const response = await apiClient.put(this.baseUrl, config);
    return response.data;
  }

  /**
   * Delete widget configuration
   */
  async deleteWidgetConfig(): Promise<void> {
    await apiClient.delete(this.baseUrl);
  }

  /**
   * Reset widget configuration to defaults
   */
  async resetWidgetConfig(): Promise<WidgetConfigResponse> {
    const response = await apiClient.post(`${this.baseUrl}/reset`);
    return response.data;
  }

  /**
   * Preview widget configuration without saving
   */
  async previewWidgetConfig(config: Partial<WidgetConfig>): Promise<WidgetConfigResponse> {
    const response = await apiClient.post(`${this.baseUrl}/preview`, config);
    return response.data;
  }

  /**
   * Get widget configuration by organizer ID (public endpoint)
   */
  async getWidgetConfigByOrganizerId(organizerId: string): Promise<WidgetConfigResponse> {
    const response = await apiClient.get(`${this.baseUrl}/public/${organizerId}`);
    return response.data;
  }

  /**
   * Get default widget configuration
   */
  getDefaultConfig(): WidgetConfig {
    return {
      organizerId: '',
      theme: {
        primaryColor: '#1976d2',
        secondaryColor: '#dc004e',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        fontFamily: 'Roboto, sans-serif',
        borderRadius: '8px',
        buttonStyle: 'rounded',
      },
      customCSS: '',
      layout: 'standard',
      language: 'en',
      currency: 'EGP',
      settings: {
        showVenueInfo: true,
        showEventDescription: true,
        realtimeUpdates: true,
        showTicketTypes: true,
        showQuantitySelector: true,
        showDiscountCodes: false,
      },
    };
  }

  /**
   * Validate widget configuration
   */
  validateConfig(config: Partial<WidgetConfig>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.theme) {
      if (config.theme.primaryColor && !this.isValidColor(config.theme.primaryColor)) {
        errors.push('Primary color must be a valid hex color');
      }
      if (config.theme.secondaryColor && !this.isValidColor(config.theme.secondaryColor)) {
        errors.push('Secondary color must be a valid hex color');
      }
      if (config.theme.backgroundColor && !this.isValidColor(config.theme.backgroundColor)) {
        errors.push('Background color must be a valid hex color');
      }
      if (config.theme.textColor && !this.isValidColor(config.theme.textColor)) {
        errors.push('Text color must be a valid hex color');
      }
    }

    if (config.layout && !['compact', 'standard', 'expanded'].includes(config.layout)) {
      errors.push('Layout must be one of: compact, standard, expanded');
    }

    if (config.language && !['en', 'ar', 'fr', 'de'].includes(config.language)) {
      errors.push('Language must be one of: en, ar, fr, de');
    }

    if (config.currency && !['EGP', 'USD', 'EUR', 'GBP'].includes(config.currency)) {
      errors.push('Currency must be one of: EGP, USD, EUR, GBP');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if a color string is valid
   */
  private isValidColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  /**
   * Generate CSS from widget configuration
   */
  generateCSS(config: WidgetConfig): string {
    const { theme } = config;
    
    return `
/* Tazkartak Widget Styles */
.tazkartak-widget {
  --primary-color: ${theme.primaryColor};
  --secondary-color: ${theme.secondaryColor};
  --background-color: ${theme.backgroundColor};
  --text-color: ${theme.textColor};
  --font-family: ${theme.fontFamily};
  --border-radius: ${theme.borderRadius};
  
  font-family: var(--font-family);
  background-color: var(--background-color);
  color: var(--text-color);
  border-radius: var(--border-radius);
}

.tazkartak-widget .primary-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: ${theme.buttonStyle === 'pill' ? '20px' : theme.borderRadius};
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.3s ease;
}

.tazkartak-widget .primary-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.tazkartak-widget .secondary-button {
  background-color: var(--secondary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: ${theme.buttonStyle === 'pill' ? '20px' : theme.borderRadius};
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.3s ease;
}

.tazkartak-widget .ticket-type {
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius);
  padding: 16px;
  margin-bottom: 12px;
}

.tazkartak-widget .ticket-type h3 {
  color: var(--primary-color);
  margin: 0 0 8px 0;
}

.tazkartak-widget .price {
  font-size: 1.2em;
  font-weight: bold;
  color: var(--primary-color);
}

.tazkartak-widget .quantity-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tazkartak-widget .quantity-selector button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tazkartak-widget .quantity-selector input {
  width: 60px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  padding: 8px;
}

.tazkartak-widget .checkout-form {
  background-color: var(--background-color);
  border-radius: var(--border-radius);
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.tazkartak-widget .form-group {
  margin-bottom: 16px;
}

.tazkartak-widget .form-group label {
  display: block;
  margin-bottom: 4px;
  color: var(--text-color);
  font-weight: 500;
}

.tazkartak-widget .form-group input,
.tazkartak-widget .form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  font-family: var(--font-family);
  font-size: 14px;
}

.tazkartak-widget .form-group input:focus,
.tazkartak-widget .form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.tazkartak-widget .loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-color);
}

.tazkartak-widget .error {
  background-color: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: var(--border-radius);
  margin-bottom: 16px;
}

.tazkartak-widget .success {
  background-color: #e8f5e8;
  color: #2e7d32;
  padding: 12px;
  border-radius: var(--border-radius);
  margin-bottom: 16px;
}

/* Custom CSS from user */
${config.customCSS || ''}
`;
  }

  /**
   * Generate embed code for the widget
   */
  generateEmbedCode(config: WidgetConfig, eventId: string, apiKey: string): string {
    const widgetUrl = `${window.location.origin}/widget.html`;
    const scriptUrl = `${window.location.origin}/widget/tazkartak-widget.umd.js`;
    
    return `<!-- Tazkartak Widget -->
<div id="tazkartak-widget-container"></div>
<script src="${scriptUrl}"></script>
<script>
  TazkartakWidget.init({
    eventId: '${eventId}',
    apiKey: '${apiKey}',
    theme: ${JSON.stringify(config.theme, null, 2)},
    layout: '${config.layout}',
    language: '${config.language}',
    currency: '${config.currency}',
    settings: ${JSON.stringify(config.settings, null, 2)}
  });
</script>`;
  }

  /**
   * Generate iframe embed code
   */
  generateIframeEmbedCode(config: WidgetConfig, eventId: string, apiKey: string): string {
    const widgetUrl = `${window.location.origin}/widget.html`;
    const params = new URLSearchParams({
      eventId,
      apiKey,
      theme: JSON.stringify(config.theme),
      layout: config.layout,
      language: config.language,
      currency: config.currency,
      settings: JSON.stringify(config.settings),
    });
    
    return `<!-- Tazkartak Widget (Iframe) -->
<iframe 
  src="${widgetUrl}?${params.toString()}"
  width="100%" 
  height="600" 
  frameborder="0"
  style="border: none; border-radius: ${config.theme.borderRadius};">
</iframe>`;
  }
}

export const widgetConfigService = new WidgetConfigService();
