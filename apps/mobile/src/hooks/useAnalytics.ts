import { useEffect, useCallback } from 'react';
import { analyticsService } from '@/services/analytics.service';

interface UseAnalyticsOptions {
  screenName?: string;
  trackScreenViews?: boolean;
  trackUserActions?: boolean;
}

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const { screenName, trackScreenViews = true, trackUserActions = true } = options;

  // Track screen view on mount
  useEffect(() => {
    if (screenName && trackScreenViews) {
      analyticsService.trackScreenView(screenName);
    }
  }, [screenName, trackScreenViews]);

  // Event tracking functions
  const trackEvent = useCallback(async (eventName: string, properties?: Record<string, any>) => {
    await analyticsService.trackEvent(eventName, properties);
  }, []);

  const trackButtonClick = useCallback(async (buttonName: string, properties?: Record<string, any>) => {
    if (trackUserActions) {
      await analyticsService.trackButtonClick(buttonName, screenName || 'unknown', properties);
    }
  }, [screenName, trackUserActions]);

  const trackFormSubmission = useCallback(async (formName: string, success: boolean, errors?: string[]) => {
    await analyticsService.trackFormSubmission(formName, success, errors);
  }, []);

  const trackSearch = useCallback(async (query: string, resultsCount: number, searchType: 'events' | 'venues') => {
    await analyticsService.trackSearch(query, resultsCount, searchType);
  }, []);

  const trackPurchase = useCallback(async (ticketId: string, eventId: string, amount: number, currency?: string) => {
    await analyticsService.trackPurchase(ticketId, eventId, amount, currency);
  }, []);

  const trackQRCodeScan = useCallback(async (ticketId: string, eventId: string, scanType: 'entry' | 'validation') => {
    await analyticsService.trackQRCodeScanned(ticketId, eventId, scanType);
  }, []);

  const trackError = useCallback(async (error: string, errorCode?: string, context?: Record<string, any>) => {
    await analyticsService.trackError(error, errorCode, context);
  }, []);

  const trackPerformance = useCallback(async (metric: string, value: number, unit?: string) => {
    await analyticsService.trackPerformance(metric, value, unit);
  }, []);

  const trackCustomEvent = useCallback(async (
    eventName: string, 
    category: 'user_action' | 'business_event' | 'technical_event' | 'error',
    properties?: Record<string, any>,
    value?: number
  ) => {
    await analyticsService.trackCustomEvent(eventName, category, properties, value);
  }, []);

  const trackUserJourney = useCallback(async (stage: string, properties?: Record<string, any>) => {
    await analyticsService.trackUserJourney(stage, properties);
  }, []);

  const trackFunnelStep = useCallback(async (step: string, stepNumber: number, totalSteps: number, properties?: Record<string, any>) => {
    await analyticsService.trackFunnelStep(step, stepNumber, totalSteps, properties);
  }, []);

  return {
    trackEvent,
    trackButtonClick,
    trackFormSubmission,
    trackSearch,
    trackPurchase,
    trackQRCodeScan,
    trackError,
    trackPerformance,
    trackCustomEvent,
    trackUserJourney,
    trackFunnelStep,
  };
};
