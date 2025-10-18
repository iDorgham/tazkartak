import * as Sentry from '@sentry/react';

interface UserContext {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
}

class SentryService {
  private isInitialized = false;

  constructor() {
    this.isInitialized = true;
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: UserContext): void {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    // Set additional tags
    if (user.role) {
      Sentry.setTag('user.role', user.role);
    }
  }

  /**
   * Clear user context (e.g., on logout)
   */
  clearUser(): void {
    Sentry.setUser(null);
    Sentry.setTag('user.role', undefined);
  }

  /**
   * Set additional context for debugging
   */
  setContext(key: string, context: Record<string, any>): void {
    Sentry.setContext(key, context);
  }

  /**
   * Set tags for filtering and grouping
   */
  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category?: string, level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal', data?: Record<string, any>): void {
    Sentry.addBreadcrumb({
      message,
      category: category || 'custom',
      level: level || 'info',
      data,
    });
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: Record<string, any>): void {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info', context?: Record<string, any>): void {
    Sentry.captureMessage(message, level, {
      contexts: {
        custom: context,
      },
    });
  }

  /**
   * Start a performance transaction
   */
  startTransaction(name: string, operation: string): Sentry.Transaction {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: PerformanceMetric): void {
    Sentry.addBreadcrumb({
      message: `Performance: ${metric.name}`,
      category: 'performance',
      level: 'info',
      data: {
        value: metric.value,
        unit: metric.unit,
        tags: metric.tags,
      },
    });
  }

  /**
   * Track API call performance
   */
  trackApiCall(url: string, method: string, duration: number, statusCode?: number, error?: Error): void {
    const transaction = this.startTransaction(`API ${method} ${url}`, 'http.client');
    
    transaction.setTag('http.method', method);
    transaction.setTag('http.url', url);
    
    if (statusCode) {
      transaction.setTag('http.status_code', statusCode.toString());
    }

    if (error) {
      transaction.setStatus('internal_error');
      this.captureException(error, {
        url,
        method,
        duration,
        statusCode,
      });
    } else {
      transaction.setStatus('ok');
    }

    transaction.setData('duration', duration);
    transaction.finish();

    // Also track as performance metric
    this.trackPerformance({
      name: `api.${method.toLowerCase()}.${url}`,
      value: duration,
      unit: 'ms',
      tags: {
        method,
        status: statusCode?.toString() || 'unknown',
      },
    });
  }

  /**
   * Track page navigation
   */
  trackPageView(pathname: string, search?: string): void {
    Sentry.addBreadcrumb({
      message: `Navigation: ${pathname}`,
      category: 'navigation',
      level: 'info',
      data: {
        pathname,
        search,
        timestamp: new Date().toISOString(),
      },
    });

    // Set page context
    this.setContext('page', {
      pathname,
      search,
      url: window.location.href,
    });
  }

  /**
   * Track user actions
   */
  trackUserAction(action: string, target?: string, data?: Record<string, any>): void {
    Sentry.addBreadcrumb({
      message: `User Action: ${action}`,
      category: 'user',
      level: 'info',
      data: {
        action,
        target,
        ...data,
      },
    });
  }

  /**
   * Track form submissions
   */
  trackFormSubmission(formName: string, success: boolean, errors?: Record<string, string[]>): void {
    Sentry.addBreadcrumb({
      message: `Form Submission: ${formName}`,
      category: 'form',
      level: success ? 'info' : 'warning',
      data: {
        formName,
        success,
        errors,
      },
    });

    if (!success && errors) {
      this.captureMessage(`Form validation failed: ${formName}`, 'warning', {
        formName,
        errors,
      });
    }
  }

  /**
   * Test Sentry integration (for development)
   */
  testIntegration(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('Testing Sentry integration...');
      
      // Test breadcrumb
      this.addBreadcrumb('Sentry integration test', 'test', 'info');
      
      // Test message
      this.captureMessage('Sentry integration test message', 'info', {
        test: true,
        timestamp: new Date().toISOString(),
      });
      
      // Test performance tracking
      this.trackPerformance({
        name: 'sentry.test',
        value: 100,
        unit: 'ms',
        tags: { test: 'true' },
      });
      
      console.log('Sentry integration test completed. Check your Sentry dashboard.');
    }
  }

  /**
   * Get Sentry client instance
   */
  getClient(): typeof Sentry {
    return Sentry;
  }

  /**
   * Check if Sentry is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized && !!Sentry.getCurrentHub().getClient();
  }
}

// Export singleton instance
export const sentryService = new SentryService();

// Export the class for testing
export { SentryService };

// Export Sentry for direct use if needed
export { Sentry };
