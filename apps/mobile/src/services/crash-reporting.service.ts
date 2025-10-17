import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { analyticsService } from './analytics.service';

interface CrashContext {
  userId?: string;
  sessionId?: string;
  screenName?: string;
  userAgent?: string;
  appVersion?: string;
  buildNumber?: string;
  deviceInfo?: {
    model: string;
    manufacturer: string;
    osVersion: string;
    platform: string;
  };
  customData?: Record<string, any>;
}

interface Breadcrumb {
  message: string;
  category: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  timestamp: number;
  data?: Record<string, any>;
}

class CrashReportingService {
  private isInitialized = false;
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private crashContext: CrashContext = {};

  async initialize(): Promise<void> {
    try {
      // Initialize crash reporting service
      // In a real implementation, you would initialize Sentry here
      // Example: Sentry.init({ dsn: 'YOUR_SENTRY_DSN' });

      await this.setupCrashContext();
      this.isInitialized = true;
      
      console.log('Crash reporting service initialized');
      
      // Track initialization
      await analyticsService.trackEvent('crash_reporting_initialized', {
        platform: Platform.OS,
        version: DeviceInfo.getVersion(),
      });
    } catch (error) {
      console.error('Failed to initialize crash reporting service:', error);
    }
  }

  private async setupCrashContext(): Promise<void> {
    try {
      const deviceInfo = {
        model: await DeviceInfo.getModel(),
        manufacturer: await DeviceInfo.getManufacturer(),
        osVersion: Platform.Version.toString(),
        platform: Platform.OS,
      };

      this.crashContext = {
        appVersion: DeviceInfo.getVersion(),
        buildNumber: DeviceInfo.getBuildNumber(),
        deviceInfo,
        userAgent: await this.getUserAgent(),
      };
    } catch (error) {
      console.error('Failed to setup crash context:', error);
    }
  }

  private async getUserAgent(): Promise<string> {
    try {
      const model = await DeviceInfo.getModel();
      const version = DeviceInfo.getVersion();
      const buildNumber = DeviceInfo.getBuildNumber();
      
      return `Tazkartak/${version} (${Platform.OS} ${Platform.Version}; ${model}) Build/${buildNumber}`;
    } catch {
      return `Tazkartak (${Platform.OS})`;
    }
  }

  // User Context
  setUser(userId: string, email?: string, username?: string): void {
    this.crashContext.userId = userId;
    
    // In Sentry, you would do:
    // Sentry.setUser({
    //   id: userId,
    //   email,
    //   username,
    // });

    this.addBreadcrumb({
      message: 'User identified',
      category: 'user',
      level: 'info',
      timestamp: Date.now(),
      data: { userId, email, username },
    });
  }

  setSession(sessionId: string): void {
    this.crashContext.sessionId = sessionId;
    
    this.addBreadcrumb({
      message: 'Session started',
      category: 'session',
      level: 'info',
      timestamp: Date.now(),
      data: { sessionId },
    });
  }

  setScreen(screenName: string): void {
    this.crashContext.screenName = screenName;
    
    this.addBreadcrumb({
      message: `Screen viewed: ${screenName}`,
      category: 'navigation',
      level: 'info',
      timestamp: Date.now(),
      data: { screenName },
    });
  }

  // Breadcrumb Management
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }

    // In Sentry, you would do:
    // Sentry.addBreadcrumb({
    //   message: breadcrumb.message,
    //   category: breadcrumb.category,
    //   level: breadcrumb.level,
    //   data: breadcrumb.data,
    // });
  }

  // Error Reporting
  captureException(error: Error, context?: Record<string, any>): void {
    console.error('Exception captured:', error);

    // Track error in analytics
    analyticsService.trackError(
      error.message,
      error.name,
      {
        ...context,
        stack: error.stack,
        ...this.crashContext,
      }
    ).catch(console.error);

    // In Sentry, you would do:
    // Sentry.captureException(error, {
    //   contexts: {
    //     app: {
    //       ...this.crashContext,
    //       ...context,
    //     },
    //   },
    //   breadcrumbs: this.breadcrumbs,
    // });

    this.addBreadcrumb({
      message: `Exception: ${error.message}`,
      category: 'error',
      level: 'error',
      data: {
        name: error.name,
        message: error.message,
        ...context,
      },
    });
  }

  captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info', context?: Record<string, any>): void {
    console.log(`Crash report message (${level}):`, message);

    // Track message in analytics if it's an error
    if (level === 'error' || level === 'fatal') {
      analyticsService.trackError(message, undefined, {
        ...context,
        level,
        ...this.crashContext,
      }).catch(console.error);
    }

    // In Sentry, you would do:
    // Sentry.captureMessage(message, level);

    this.addBreadcrumb({
      message,
      category: 'log',
      level,
      data: context,
    });
  }

  // Performance Monitoring
  startTransaction(name: string, operation: string): Transaction {
    const transaction = new Transaction(name, operation, this);
    
    this.addBreadcrumb({
      message: `Transaction started: ${name}`,
      category: 'performance',
      level: 'info',
      data: { operation },
    });

    return transaction;
  }

  // Custom Context
  setContext(key: string, context: Record<string, any>): void {
    this.crashContext.customData = {
      ...this.crashContext.customData,
      [key]: context,
    };

    // In Sentry, you would do:
    // Sentry.setContext(key, context);
  }

  setTag(key: string, value: string): void {
    // In Sentry, you would do:
    // Sentry.setTag(key, value);

    this.addBreadcrumb({
      message: `Tag set: ${key}=${value}`,
      category: 'tag',
      level: 'debug',
      data: { key, value },
    });
  }

  // Manual Crash Reporting
  crash(): void {
    this.captureMessage('Manual crash triggered', 'fatal', {
      triggered_by: 'manual',
      ...this.crashContext,
    });

    // In Sentry, you would do:
    // Sentry.crash();

    // For testing purposes, throw an error
    throw new Error('Manual crash for testing purposes');
  }

  // Error Boundary Integration
  setErrorBoundary(error: Error, errorInfo: any): void {
    this.captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  // Get crash data for debugging
  getCrashData(): {
    context: CrashContext;
    breadcrumbs: Breadcrumb[];
    isInitialized: boolean;
  } {
    return {
      context: { ...this.crashContext },
      breadcrumbs: [...this.breadcrumbs],
      isInitialized: this.isInitialized,
    };
  }

  // Cleanup
  async close(): Promise<void> {
    try {
      // In Sentry, you would do:
      // await Sentry.close();

      this.breadcrumbs = [];
      this.crashContext = {};
      this.isInitialized = false;

      console.log('Crash reporting service closed');
    } catch (error) {
      console.error('Failed to close crash reporting service:', error);
    }
  }
}

// Transaction class for performance monitoring
class Transaction {
  private name: string;
  private operation: string;
  private startTime: number;
  private crashService: CrashReportingService;
  private spans: Array<{ name: string; startTime: number; endTime?: number }> = [];

  constructor(name: string, operation: string, crashService: CrashReportingService) {
    this.name = name;
    this.operation = operation;
    this.startTime = Date.now();
    this.crashService = crashService;
  }

  startSpan(name: string): Span {
    const span = new Span(name, this);
    this.spans.push({
      name,
      startTime: Date.now(),
    });
    return span;
  }

  finish(): void {
    const duration = Date.now() - this.startTime;
    
    this.crashService.addBreadcrumb({
      message: `Transaction finished: ${this.name}`,
      category: 'performance',
      level: 'info',
      data: {
        operation: this.operation,
        duration,
        spanCount: this.spans.length,
      },
    });

    // Track performance metric
    analyticsService.trackPerformance(`transaction_${this.name}`, duration, 'ms').catch(console.error);
  }

  setStatus(status: 'ok' | 'cancelled' | 'unknown_error' | 'invalid_argument' | 'deadline_exceeded' | 'not_found' | 'already_exists' | 'permission_denied' | 'resource_exhausted' | 'failed_precondition' | 'aborted' | 'out_of_range' | 'unimplemented' | 'internal_error' | 'unavailable' | 'data_loss' | 'unauthenticated'): void {
    this.crashService.addBreadcrumb({
      message: `Transaction status: ${status}`,
      category: 'performance',
      level: status === 'ok' ? 'info' : 'error',
      data: { status },
    });
  }
}

// Span class for performance monitoring
class Span {
  private name: string;
  private startTime: number;
  private transaction: Transaction;
  private finished: boolean = false;

  constructor(name: string, transaction: Transaction) {
    this.name = name;
    this.startTime = Date.now();
    this.transaction = transaction;
  }

  finish(): void {
    if (this.finished) return;
    
    const duration = Date.now() - this.startTime;
    this.finished = true;

    // Track span performance
    analyticsService.trackPerformance(`span_${this.name}`, duration, 'ms').catch(console.error);
  }

  setStatus(status: string): void {
    // In Sentry, you would set the span status
    console.log(`Span ${this.name} status: ${status}`);
  }
}

export const crashReportingService = new CrashReportingService();
