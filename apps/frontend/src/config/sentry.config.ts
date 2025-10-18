import * as Sentry from '@sentry/react';

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN || 'https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512',
    environment: process.env.NODE_ENV || 'development',
    
    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Capture 10% of all sessions,
        // plus 100% of sessions with an error
        sessionSampleRate: 0.1,
        errorSampleRate: 1.0,
      }),
    ],
    
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/api\.tazkartak\.com\/api/,
      /^https:\/\/.*\.tazkartak\.com\/api/,
    ],
    
    // Capture unhandled promise rejections
    captureUnhandledRejections: true,
    
    // Set sample rate for session replay
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,
    replaysOnErrorSampleRate: 1.0,
    
    // Additional configuration
    beforeSend(event, hint) {
      // Filter out development errors in production
      if (process.env.NODE_ENV === 'production' && event.exception) {
        const error = hint.originalException;
        if (error instanceof Error && error.message.includes('Non-Error promise rejection')) {
          return null;
        }
      }
      return event;
    },
    
    beforeSendTransaction(event) {
      // Filter out health check transactions
      if (event.transaction?.includes('/health')) {
        return null;
      }
      return event;
    },
  });
};

// Export Sentry components for use in the app
export { Sentry };
