interface WidgetConfig {
  eventId: string;
  apiKey: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    borderRadius?: string;
    buttonStyle?: 'rounded' | 'square' | 'pill';
  };
  customCSS?: string;
  layout?: 'compact' | 'standard' | 'expanded';
  language?: string;
  currency?: string;
  showVenueInfo?: boolean;
  showEventDescription?: boolean;
  realTimeUpdates?: boolean;
  onPurchase?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface TazkartakWidget {
  init: (config: WidgetConfig) => void;
  destroy: () => void;
  updateConfig: (config: Partial<WidgetConfig>) => void;
}

// Main initialization script
(function(window: Window) {
  let widgetInstance: any = null;
  let iframe: HTMLIFrameElement | null = null;

  const TazkartakWidget: TazkartakWidget = {
    init: function(config: WidgetConfig) {
      // Validate required config
      if (!config.eventId || !config.apiKey) {
        throw new Error('TazkartakWidget: eventId and apiKey are required');
      }

      // Create iframe with secure sandbox
      iframe = document.createElement('iframe');
      iframe.src = `https://widget.tazkartak.com/widget.html?eventId=${config.eventId}&apiKey=${config.apiKey}`;
      iframe.style.border = 'none';
      iframe.style.width = '100%';
      iframe.style.minHeight = '400px';
      iframe.style.borderRadius = config.theme?.borderRadius || '8px';
      
      // Security attributes
      iframe.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-forms', 'allow-popups');
      
      // Add CSP for security
      iframe.setAttribute('csp', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");

      // Find container
      const container = document.getElementById('tazkartak-widget');
      if (!container) {
        throw new Error('TazkartakWidget: Container element with id "tazkartak-widget" not found');
      }

      // Clear container and add iframe
      container.innerHTML = '';
      container.appendChild(iframe);

      // Handle postMessage communication
      const handleMessage = (event: MessageEvent) => {
        // Verify origin for security
        if (event.origin !== 'https://widget.tazkartak.com') {
          return;
        }

        const { type, data } = event.data;

        switch (type) {
          case 'widget-ready':
            // Send configuration to widget
            iframe?.contentWindow?.postMessage({
              type: 'config',
              config: {
                theme: config.theme,
                customCSS: config.customCSS,
                layout: config.layout,
                language: config.language,
                currency: config.currency,
                showVenueInfo: config.showVenueInfo,
                showEventDescription: config.showEventDescription,
                realTimeUpdates: config.realTimeUpdates
              }
            }, 'https://widget.tazkartak.com');
            break;

          case 'resize':
            // Adjust iframe height
            if (iframe && data.height) {
              iframe.style.height = `${data.height}px`;
            }
            break;

          case 'purchase-complete':
            // Notify parent page
            if (config.onPurchase) {
              config.onPurchase(data);
            }
            break;

          case 'error':
            // Handle errors
            if (config.onError) {
              config.onError(new Error(data.message));
            }
            console.error('TazkartakWidget Error:', data.message);
            break;
        }
      };

      window.addEventListener('message', handleMessage);

      // Store cleanup function
      widgetInstance = {
        config,
        cleanup: () => {
          window.removeEventListener('message', handleMessage);
          if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
          iframe = null;
        }
      };
    },

    destroy: function() {
      if (widgetInstance) {
        widgetInstance.cleanup();
        widgetInstance = null;
      }
    },

    updateConfig: function(newConfig: Partial<WidgetConfig>) {
      if (widgetInstance && iframe) {
        widgetInstance.config = { ...widgetInstance.config, ...newConfig };
        iframe.contentWindow?.postMessage({
          type: 'config-update',
          config: newConfig
        }, 'https://widget.tazkartak.com');
      }
    }
  };

  // Expose to global scope
  window.TazkartakWidget = TazkartakWidget;

})(window);

// Type declaration for global
declare global {
  interface Window {
    TazkartakWidget: TazkartakWidget;
  }
}

export {};
