# Sentry Integration for Tazkartak Frontend

This document describes the Sentry integration for performance monitoring and error tracking in the Tazkartak frontend application.

## Overview

Sentry has been integrated into the React frontend to provide:
- **Error Tracking**: Automatic capture of JavaScript errors and unhandled promise rejections
- **Performance Monitoring**: Track page load times, API calls, and user interactions
- **Session Replay**: Record user sessions to help debug issues
- **User Context**: Associate errors with specific users and their actions

## Installation

The Sentry React SDK has been installed as a dependency:

```json
{
  "dependencies": {
    "@sentry/react": "^7.100.0"
  }
}
```

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Sentry Configuration
REACT_APP_SENTRY_DSN=https://8b8d198c43d88181fd78124f4a2f723a@o4510143363219456.ingest.de.sentry.io/4510143365906512
```

### Sentry Configuration File

The main configuration is in `src/config/sentry.config.ts`:

```typescript
import * as Sentry from '@sentry/react';

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        sessionSampleRate: 0.1,
        errorSampleRate: 1.0,
      }),
    ],
    
    // Sampling rates
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,
    replaysOnErrorSampleRate: 1.0,
    
    // Distributed tracing
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/api\.tazkartak\.com\/api/,
      /^https:\/\/.*\.tazkartak\.com\/api/,
    ],
  });
};
```

## Components

### 1. Error Boundary

The `SentryErrorBoundary` component (`src/components/common/SentryErrorBoundary.tsx`) provides:

- Automatic error capture for React component errors
- User-friendly error UI with recovery options
- Development-only error details
- User context association

```typescript
import SentryErrorBoundary from './components/common/SentryErrorBoundary';

// Wrap your app
<SentryErrorBoundary>
  <App />
</SentryErrorBoundary>
```

### 2. Sentry Service

The `SentryService` class (`src/services/sentry.service.ts`) provides a convenient API for:

- Setting user context
- Tracking performance metrics
- Capturing custom events
- API call monitoring

```typescript
import { sentryService } from './services/sentry.service';

// Set user context
sentryService.setUser({
  id: 'user123',
  email: 'user@example.com',
  role: 'ORGANIZER'
});

// Track API calls
sentryService.trackApiCall('/api/events', 'GET', 150, 200);

// Track performance
sentryService.trackPerformance({
  name: 'page.load',
  value: 1200,
  unit: 'ms'
});
```

### 3. Test Component

The `SentryTestButton` component (`src/components/common/SentryTestButton.tsx`) provides:

- Integration testing capabilities
- Error simulation
- Performance testing
- Development-only visibility

## Usage Examples

### Basic Error Tracking

```typescript
import { sentryService } from './services/sentry.service';

try {
  // Some risky operation
  await riskyOperation();
} catch (error) {
  sentryService.captureException(error, {
    operation: 'riskyOperation',
    userId: currentUser.id
  });
}
```

### Performance Monitoring

```typescript
import { sentryService } from './services/sentry.service';

// Track page load time
const startTime = Date.now();
// ... page loading logic
const loadTime = Date.now() - startTime;

sentryService.trackPerformance({
  name: 'page.load',
  value: loadTime,
  unit: 'ms',
  tags: { page: 'dashboard' }
});
```

### API Call Tracking

```typescript
import { sentryService } from './services/sentry.service';

const trackApiCall = async (url: string, method: string, request: any) => {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method,
      body: JSON.stringify(request)
    });
    
    const duration = Date.now() - startTime;
    sentryService.trackApiCall(url, method, duration, response.status);
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    sentryService.trackApiCall(url, method, duration, undefined, error);
    throw error;
  }
};
```

### User Action Tracking

```typescript
import { sentryService } from './services/sentry.service';

const handleButtonClick = (buttonName: string) => {
  sentryService.trackUserAction('button_click', buttonName, {
    page: window.location.pathname,
    timestamp: new Date().toISOString()
  });
  
  // ... button logic
};
```

## Integration Points

### 1. App Initialization

Sentry is initialized as early as possible in `src/index.tsx`:

```typescript
import { initSentry } from './config/sentry.config';

// Initialize Sentry as early as possible
initSentry();
```

### 2. Error Boundary Integration

The entire app is wrapped with the Sentry Error Boundary:

```typescript
<SentryErrorBoundary>
  <HelmetProvider>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </HelmetProvider>
</SentryErrorBoundary>
```

### 3. User Context

User context should be set when users log in:

```typescript
// In your auth service
import { sentryService } from './services/sentry.service';

const login = async (credentials) => {
  const user = await authenticate(credentials);
  
  // Set Sentry user context
  sentryService.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  });
  
  return user;
};
```

## Testing

### Development Testing

1. Navigate to the Admin Dashboard (development mode only)
2. Use the "Sentry Test Button" to run integration tests
3. Check the browser console for test results
4. Verify data appears in your Sentry dashboard

### Production Monitoring

1. Monitor the Sentry dashboard for errors and performance issues
2. Set up alerts for critical errors
3. Review session replays for user experience issues
4. Analyze performance trends and bottlenecks

## Best Practices

### 1. Error Handling

- Always wrap risky operations in try-catch blocks
- Provide meaningful context when capturing errors
- Use appropriate error levels (error, warning, info)

### 2. Performance Monitoring

- Track key user interactions and page loads
- Monitor API call performance
- Set up performance budgets and alerts

### 3. User Privacy

- Be mindful of sensitive data in error reports
- Use data scrubbing for PII
- Respect user privacy preferences

### 4. Sampling

- Use appropriate sampling rates for production
- Monitor Sentry usage and costs
- Adjust sampling based on traffic volume

## Troubleshooting

### Common Issues

1. **Sentry not capturing errors**
   - Check DSN configuration
   - Verify network connectivity
   - Check browser console for Sentry errors

2. **Performance data not appearing**
   - Verify `tracesSampleRate` is set
   - Check `tracePropagationTargets` configuration
   - Ensure API endpoints are included

3. **Session replays not working**
   - Check `replayIntegration` is included
   - Verify sampling rates are set
   - Check for CORS issues

### Debug Mode

Enable debug mode by adding to your Sentry configuration:

```typescript
Sentry.init({
  // ... other config
  debug: process.env.NODE_ENV === 'development',
});
```

## Security Considerations

1. **DSN Security**: Keep your Sentry DSN secure and don't commit it to version control
2. **Data Scrubbing**: Configure data scrubbing to remove sensitive information
3. **Access Control**: Limit Sentry dashboard access to authorized personnel
4. **Rate Limiting**: Monitor and configure appropriate rate limits

## Monitoring and Alerts

Set up the following alerts in Sentry:

1. **Error Rate Alerts**: Alert when error rate exceeds threshold
2. **Performance Alerts**: Alert on slow page loads or API calls
3. **New Error Alerts**: Alert on new error types
4. **User Impact Alerts**: Alert on errors affecting many users

## Cost Management

1. **Sampling**: Use appropriate sampling rates to control data volume
2. **Data Retention**: Configure appropriate data retention periods
3. **Quota Monitoring**: Monitor usage against your Sentry plan limits
4. **Filtering**: Use beforeSend hooks to filter unnecessary data

## Support

For Sentry-specific issues:
- Check the [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- Review the [Sentry React SDK](https://github.com/getsentry/sentry-javascript/tree/master/packages/react)
- Contact Sentry support for platform issues

For Tazkartak-specific integration issues:
- Check the test component for integration status
- Review the service implementation
- Check environment configuration
