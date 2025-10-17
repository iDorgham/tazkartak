import { WidgetConfig } from '../types/widget.types';

export const getConfigFromURL = (): Partial<WidgetConfig> => {
  const urlParams = new URLSearchParams(window.location.search);
  
  const config: Partial<WidgetConfig> = {
    eventId: urlParams.get('eventId') || '',
    apiKey: urlParams.get('apiKey') || '',
  };

  // Parse theme from URL
  const themeParam = urlParams.get('theme');
  if (themeParam) {
    try {
      config.theme = JSON.parse(decodeURIComponent(themeParam));
    } catch (error) {
      console.warn('Failed to parse theme from URL:', error);
    }
  }

  // Parse other config options
  const layout = urlParams.get('layout');
  if (layout && ['compact', 'standard', 'expanded'].includes(layout)) {
    config.layout = layout as 'compact' | 'standard' | 'expanded';
  }

  const language = urlParams.get('language');
  if (language) {
    config.language = language;
  }

  const currency = urlParams.get('currency');
  if (currency) {
    config.currency = currency;
  }

  const showVenueInfo = urlParams.get('showVenueInfo');
  if (showVenueInfo) {
    config.showVenueInfo = showVenueInfo === 'true';
  }

  const showEventDescription = urlParams.get('showEventDescription');
  if (showEventDescription) {
    config.showEventDescription = showEventDescription === 'true';
  }

  const realTimeUpdates = urlParams.get('realTimeUpdates');
  if (realTimeUpdates) {
    config.realTimeUpdates = realTimeUpdates === 'true';
  }

  return config;
};

export const applyTheme = (config: WidgetConfig): void => {
  const root = document.documentElement;
  
  if (config.theme) {
    const { theme } = config;
    
    if (theme.primaryColor) {
      root.style.setProperty('--tazkartak-primary', theme.primaryColor);
    }
    
    if (theme.secondaryColor) {
      root.style.setProperty('--tazkartak-secondary', theme.secondaryColor);
    }
    
    if (theme.backgroundColor) {
      root.style.setProperty('--tazkartak-background', theme.backgroundColor);
    }
    
    if (theme.textColor) {
      root.style.setProperty('--tazkartak-text', theme.textColor);
    }
    
    if (theme.fontFamily) {
      root.style.setProperty('--tazkartak-font-family', theme.fontFamily);
    }
    
    if (theme.borderRadius) {
      root.style.setProperty('--tazkartak-border-radius', theme.borderRadius);
    }
  }

  // Apply custom CSS
  if (config.customCSS) {
    const styleId = 'tazkartak-custom-css';
    let customStyle = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!customStyle) {
      customStyle = document.createElement('style');
      customStyle.id = styleId;
      document.head.appendChild(customStyle);
    }
    
    customStyle.textContent = config.customCSS;
  }
};

export const generateEmbedCode = (config: WidgetConfig): string => {
  const themeParam = config.theme ? encodeURIComponent(JSON.stringify(config.theme)) : '';
  
  return `
<div id="tazkartak-widget"></div>
<script src="https://widget.tazkartak.com/embed.js"></script>
<script>
  TazkartakWidget.init({
    eventId: '${config.eventId}',
    apiKey: '${config.apiKey}',
    theme: ${config.theme ? JSON.stringify(config.theme, null, 2) : '{}'},
    layout: '${config.layout || 'standard'}',
    language: '${config.language || 'en'}',
    currency: '${config.currency || 'EGP'}',
    showVenueInfo: ${config.showVenueInfo ?? true},
    showEventDescription: ${config.showEventDescription ?? true},
    realTimeUpdates: ${config.realTimeUpdates ?? false}
  });
</script>`.trim();
};

export const generateIframeCode = (config: WidgetConfig): string => {
  const params = new URLSearchParams({
    eventId: config.eventId,
    apiKey: config.apiKey,
  });

  if (config.theme) {
    params.set('theme', JSON.stringify(config.theme));
  }
  if (config.layout) {
    params.set('layout', config.layout);
  }
  if (config.language) {
    params.set('language', config.language);
  }
  if (config.currency) {
    params.set('currency', config.currency);
  }
  if (config.showVenueInfo !== undefined) {
    params.set('showVenueInfo', config.showVenueInfo.toString());
  }
  if (config.showEventDescription !== undefined) {
    params.set('showEventDescription', config.showEventDescription.toString());
  }
  if (config.realTimeUpdates !== undefined) {
    params.set('realTimeUpdates', config.realTimeUpdates.toString());
  }

  return `<iframe 
  src="https://widget.tazkartak.com/widget.html?${params.toString()}"
  width="100%" 
  height="600" 
  frameborder="0" 
  scrolling="no"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups">
</iframe>`;
};
