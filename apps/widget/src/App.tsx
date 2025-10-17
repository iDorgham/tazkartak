import React, { useState, useEffect } from 'react';
import { TicketWidget } from './components/TicketWidget';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WidgetConfig } from './types/widget.types';
import { getConfigFromURL } from './utils/config.utils';
import { analytics } from './services/analytics';

const App: React.FC = () => {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeWidget = async () => {
      try {
        // Get configuration from URL parameters or postMessage
        const urlConfig = getConfigFromURL();
        
        // Listen for configuration from parent window
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin && 
              !event.origin.includes('tazkartak.com')) {
            return;
          }

          const { type, config: messageConfig } = event.data;

          if (type === 'config' || type === 'config-update') {
            setConfig(prevConfig => ({
              ...prevConfig,
              ...messageConfig,
              ...urlConfig
            }));
            setLoading(false);
          }
        };

        window.addEventListener('message', handleMessage);

        // Send ready signal to parent
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'widget-ready' }, '*');
        }

        // Set initial config if available
        if (urlConfig.eventId && urlConfig.apiKey) {
          setConfig(urlConfig);
          setLoading(false);
        } else {
          // Wait for config from parent
          setTimeout(() => {
            if (!config) {
              setError('Widget configuration not provided');
              setLoading(false);
            }
          }, 5000);
        }

        // Track widget load
        analytics.track('widget_loaded', {
          eventId: urlConfig.eventId,
          hasApiKey: !!urlConfig.apiKey
        });

        return () => {
          window.removeEventListener('message', handleMessage);
        };
      } catch (err) {
        console.error('Failed to initialize widget:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize widget');
        setLoading(false);
      }
    };

    initializeWidget();
  }, []);

  if (loading) {
    return (
      <div className="tazkartak-widget-loading">
        <div className="loading-spinner"></div>
        <p>Loading ticket widget...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tazkartak-widget-error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="tazkartak-widget-error">
        <div className="error-icon">⚠️</div>
        <p>Widget configuration not provided</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="tazkartak-widget" data-layout={config.layout}>
        <TicketWidget config={config} />
      </div>
    </ErrorBoundary>
  );
};

export default App;
