import { useEffect, useCallback } from 'react';
import { performanceService } from '@/services/performance.service';

interface UsePerformanceOptions {
  screenName: string;
  trackAPICalls?: boolean;
  trackMemory?: boolean;
}

export const usePerformance = (options: UsePerformanceOptions) => {
  const { screenName, trackAPICalls = false, trackMemory = false } = options;

  useEffect(() => {
    const endTimer = performanceService.startScreenTimer(screenName);
    
    return () => {
      endTimer();
    };
  }, [screenName]);

  const trackAPICall = useCallback((endpoint: string) => {
    if (!trackAPICalls) return () => {};
    
    return performanceService.startAPITimer(endpoint);
  }, [trackAPICalls]);

  const getPerformanceMetrics = useCallback(() => {
    return {
      screen: performanceService.getScreenPerformanceSummary(),
      api: performanceService.getAPIPerformanceSummary(),
      memory: performanceService.getMemorySummary(),
      recommendations: performanceService.getPerformanceRecommendations(),
    };
  }, []);

  return {
    trackAPICall,
    getPerformanceMetrics,
  };
};
