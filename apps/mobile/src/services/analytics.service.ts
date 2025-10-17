import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

interface UserProperties {
  userId: string;
  email?: string;
  role: string;
  subscriptionPlan?: string;
  appVersion: string;
  deviceInfo: {
    platform: string;
    version: string;
    model: string;
    manufacturer: string;
    isEmulator: boolean;
  };
  location?: {
    country?: string;
    city?: string;
  };
}

interface ScreenViewEvent {
  screenName: string;
  screenClass: string;
  previousScreen?: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface CustomEvent {
  eventName: string;
  category: 'user_action' | 'business_event' | 'technical_event' | 'error';
  properties?: Record<string, any>;
  value?: number;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private userProperties?: UserProperties;
  private eventQueue: AnalyticsEvent[] = [];
  private screenHistory: string[] = [];
  private isInitialized = false;
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  async initialize(): Promise<void> {
    try {
      // Load user properties if available
      await this.loadUserProperties();
      
      // Start batch processing
      this.startBatchProcessing();
      
      // Track app launch
      await this.trackEvent('app_launched', {
        platform: Platform.OS,
        version: DeviceInfo.getVersion(),
        build_number: DeviceInfo.getBuildNumber(),
        is_first_launch: await this.isFirstLaunch(),
      });

      this.isInitialized = true;
      console.log('Analytics service initialized');
    } catch (error) {
      console.error('Failed to initialize analytics service:', error);
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async isFirstLaunch(): Promise<boolean> {
    try {
      const hasLaunched = await AsyncStorage.getItem('app_has_launched');
      if (!hasLaunched) {
        await AsyncStorage.setItem('app_has_launched', 'true');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // User Management
  async identifyUser(userId: string, properties?: Partial<UserProperties>): Promise<void> {
    try {
      this.userId = userId;
      
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model: await DeviceInfo.getModel(),
        manufacturer: await DeviceInfo.getManufacturer(),
        isEmulator: await DeviceInfo.isEmulator(),
      };

      this.userProperties = {
        userId,
        appVersion: DeviceInfo.getVersion(),
        deviceInfo,
        ...properties,
      };

      // Save user properties
      await AsyncStorage.setItem('analytics_user_properties', JSON.stringify(this.userProperties));

      // Track user identification
      await this.trackEvent('user_identified', {
        user_id: userId,
        role: this.userProperties.role,
        subscription_plan: this.userProperties.subscriptionPlan,
      });
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  async resetUser(): Promise<void> {
    try {
      this.userId = undefined;
      this.userProperties = undefined;
      this.sessionId = this.generateSessionId();
      this.screenHistory = [];
      
      await AsyncStorage.removeItem('analytics_user_properties');
      
      console.log('User analytics reset');
    } catch (error) {
      console.error('Failed to reset user analytics:', error);
    }
  }

  private async loadUserProperties(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('analytics_user_properties');
      if (stored) {
        this.userProperties = JSON.parse(stored);
        this.userId = this.userProperties?.userId;
      }
    } catch (error) {
      console.error('Failed to load user properties:', error);
    }
  }

  // Event Tracking
  async trackEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        name: eventName,
        properties: {
          ...properties,
          session_id: this.sessionId,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        userId: this.userId,
        sessionId: this.sessionId,
      };

      this.eventQueue.push(event);

      // Auto-flush if queue is full
      if (this.eventQueue.length >= this.batchSize) {
        await this.flushEvents();
      }

      console.log(`Analytics event tracked: ${eventName}`, properties);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  async trackScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      const previousScreen = this.screenHistory[this.screenHistory.length - 1];
      
      const screenView: ScreenViewEvent = {
        screenName,
        screenClass: screenClass || screenName,
        previousScreen,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
      };

      // Track screen view
      await this.trackEvent('screen_viewed', {
        screen_name: screenName,
        screen_class: screenClass || screenName,
        previous_screen: previousScreen,
        time_on_previous_screen: this.calculateTimeOnPreviousScreen(),
      });

      // Update screen history
      this.screenHistory.push(screenName);
      if (this.screenHistory.length > 10) {
        this.screenHistory = this.screenHistory.slice(-10);
      }

      console.log(`Screen viewed: ${screenName}`);
    } catch (error) {
      console.error('Failed to track screen view:', error);
    }
  }

  private calculateTimeOnPreviousScreen(): number {
    // This would typically track time spent on previous screen
    // For now, return a placeholder value
    return 0;
  }

  // Business Event Tracking
  async trackPurchase(ticketId: string, eventId: string, amount: number, currency: string = 'EGP'): Promise<void> {
    await this.trackEvent('ticket_purchased', {
      ticket_id: ticketId,
      event_id: eventId,
      amount,
      currency,
      payment_method: 'unknown', // Would be set by payment service
    });
  }

  async trackEventCreated(eventId: string, eventTitle: string, category: string): Promise<void> {
    await this.trackEvent('event_created', {
      event_id: eventId,
      event_title: eventTitle,
      category,
    });
  }

  async trackQRCodeScanned(ticketId: string, eventId: string, scanType: 'entry' | 'validation'): Promise<void> {
    await this.trackEvent('qr_code_scanned', {
      ticket_id: ticketId,
      event_id: eventId,
      scan_type: scanType,
    });
  }

  async trackSearch(query: string, resultsCount: number, searchType: 'events' | 'venues'): Promise<void> {
    await this.trackEvent('search_performed', {
      query,
      results_count: resultsCount,
      search_type: searchType,
    });
  }

  async trackError(error: string, errorCode?: string, context?: Record<string, any>): Promise<void> {
    await this.trackEvent('error_occurred', {
      error_message: error,
      error_code: errorCode,
      context,
      severity: 'error',
    });
  }

  async trackPerformance(metric: string, value: number, unit: string = 'ms'): Promise<void> {
    await this.trackEvent('performance_metric', {
      metric_name: metric,
      metric_value: value,
      metric_unit: unit,
    });
  }

  // User Behavior Tracking
  async trackButtonClick(buttonName: string, screenName: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('button_clicked', {
      button_name: buttonName,
      screen_name: screenName,
      ...properties,
    });
  }

  async trackFormSubmission(formName: string, success: boolean, errors?: string[]): Promise<void> {
    await this.trackEvent('form_submitted', {
      form_name: formName,
      success,
      errors: errors || [],
    });
  }

  async trackShare(contentType: 'event' | 'ticket', contentId: string, platform?: string): Promise<void> {
    await this.trackEvent('content_shared', {
      content_type: contentType,
      content_id: contentId,
      platform,
    });
  }

  // Custom Event Tracking
  async trackCustomEvent(eventName: string, category: CustomEvent['category'], properties?: Record<string, any>, value?: number): Promise<void> {
    const customEvent: CustomEvent = {
      eventName,
      category,
      properties,
      value,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    await this.trackEvent('custom_event', {
      event_name: eventName,
      category,
      properties,
      value,
    });
  }

  // Batch Processing
  private startBatchProcessing(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.flushInterval);
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const eventsToFlush = [...this.eventQueue];
      this.eventQueue = [];

      // In a real implementation, you would send these to your analytics service
      // For now, we'll just log them and store locally
      console.log(`Flushing ${eventsToFlush.length} analytics events`);

      // Store events locally for debugging/offline capability
      await this.storeEventsLocally(eventsToFlush);

      // Send to analytics service (Firebase Analytics, Mixpanel, etc.)
      await this.sendEventsToService(eventsToFlush);

    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-add events to queue if flush failed
      this.eventQueue.unshift(...this.eventQueue);
    }
  }

  private async storeEventsLocally(events: AnalyticsEvent[]): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('analytics_events');
      const existingEvents = stored ? JSON.parse(stored) : [];
      
      const allEvents = [...existingEvents, ...events];
      
      // Keep only last 1000 events
      const trimmedEvents = allEvents.slice(-1000);
      
      await AsyncStorage.setItem('analytics_events', JSON.stringify(trimmedEvents));
    } catch (error) {
      console.error('Failed to store events locally:', error);
    }
  }

  private async sendEventsToService(events: AnalyticsEvent[]): Promise<void> {
    // This would integrate with your chosen analytics service
    // Examples: Firebase Analytics, Mixpanel, Amplitude, etc.
    
    // Simulate API call
    console.log('Sending events to analytics service:', events.length);
    
    // Example Firebase Analytics integration:
    // events.forEach(event => {
    //   firebase.analytics().logEvent(event.name, event.properties);
    // });
  }

  // Analytics Data Retrieval
  async getAnalyticsData(): Promise<{
    totalEvents: number;
    sessionEvents: number;
    userEvents: number;
    recentEvents: AnalyticsEvent[];
  }> {
    try {
      const stored = await AsyncStorage.getItem('analytics_events');
      const allEvents = stored ? JSON.parse(stored) : [];
      
      const sessionEvents = allEvents.filter((e: AnalyticsEvent) => e.sessionId === this.sessionId);
      const userEvents = this.userId ? allEvents.filter((e: AnalyticsEvent) => e.userId === this.userId) : [];
      const recentEvents = allEvents.slice(-50); // Last 50 events

      return {
        totalEvents: allEvents.length,
        sessionEvents: sessionEvents.length,
        userEvents: userEvents.length,
        recentEvents,
      };
    } catch (error) {
      console.error('Failed to get analytics data:', error);
      return {
        totalEvents: 0,
        sessionEvents: 0,
        userEvents: 0,
        recentEvents: [],
      };
    }
  }

  // User Journey Tracking
  async trackUserJourney(stage: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('user_journey', {
      journey_stage: stage,
      ...properties,
    });
  }

  async trackFunnelStep(step: string, stepNumber: number, totalSteps: number, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('funnel_step', {
      step_name: step,
      step_number: stepNumber,
      total_steps: totalSteps,
      completion_percentage: (stepNumber / totalSteps) * 100,
      ...properties,
    });
  }

  // Cleanup
  async destroy(): Promise<void> {
    try {
      // Flush remaining events
      await this.flushEvents();
      
      // Clear timer
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
      }
      
      console.log('Analytics service destroyed');
    } catch (error) {
      console.error('Failed to destroy analytics service:', error);
    }
  }

  // Utility Methods
  getSessionId(): string {
    return this.sessionId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getUserProperties(): UserProperties | undefined {
    return this.userProperties;
  }

  isUserIdentified(): boolean {
    return !!this.userId;
  }
}

export const analyticsService = new AnalyticsService();
