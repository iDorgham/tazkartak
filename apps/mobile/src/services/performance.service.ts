import { Dimensions, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

interface PerformanceMetrics {
  screenLoadTime: number;
  apiCallDuration: number;
  memoryUsage: number;
  frameRate: number;
  bundleSize: number;
  appLaunchTime: number;
}

interface ScreenMetrics {
  screenName: string;
  loadTime: number;
  timestamp: number;
  memoryUsage: number;
}

interface APIMetrics {
  endpoint: string;
  duration: number;
  timestamp: number;
  statusCode: number;
  responseSize?: number;
}

interface MemoryInfo {
  used: number;
  total: number;
  free: number;
  usagePercentage: number;
}

class PerformanceService {
  private screenMetrics: ScreenMetrics[] = [];
  private apiMetrics: APIMetrics[] = [];
  private frameRateMetrics: number[] = [];
  private isMonitoring = false;
  private frameCount = 0;
  private lastFrameTime = Date.now();
  private memoryCheckInterval?: NodeJS.Timeout;

  async initialize(): Promise<void> {
    try {
      this.startMemoryMonitoring();
      this.startFrameRateMonitoring();
      console.log('Performance service initialized');
    } catch (error) {
      console.error('Failed to initialize performance service:', error);
    }
  }

  // Screen Performance Monitoring
  startScreenTimer(screenName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const loadTime = Date.now() - startTime;
      this.recordScreenMetrics(screenName, loadTime);
    };
  }

  private recordScreenMetrics(screenName: string, loadTime: number): void {
    const memoryInfo = this.getCurrentMemoryUsage();
    
    const metrics: ScreenMetrics = {
      screenName,
      loadTime,
      timestamp: Date.now(),
      memoryUsage: memoryInfo.used,
    };

    this.screenMetrics.push(metrics);
    
    // Keep only last 100 screen metrics
    if (this.screenMetrics.length > 100) {
      this.screenMetrics = this.screenMetrics.slice(-100);
    }

    // Log slow screens
    if (loadTime > 2000) {
      console.warn(`Slow screen load detected: ${screenName} took ${loadTime}ms`);
    }

    console.log(`Screen ${screenName} loaded in ${loadTime}ms`);
  }

  // API Performance Monitoring
  startAPITimer(endpoint: string): (statusCode: number, responseSize?: number) => void {
    const startTime = Date.now();
    
    return (statusCode: number, responseSize?: number) => {
      const duration = Date.now() - startTime;
      this.recordAPIMetrics(endpoint, duration, statusCode, responseSize);
    };
  }

  private recordAPIMetrics(
    endpoint: string, 
    duration: number, 
    statusCode: number, 
    responseSize?: number
  ): void {
    const metrics: APIMetrics = {
      endpoint,
      duration,
      timestamp: Date.now(),
      statusCode,
      responseSize,
    };

    this.apiMetrics.push(metrics);
    
    // Keep only last 200 API metrics
    if (this.apiMetrics.length > 200) {
      this.apiMetrics = this.apiMetrics.slice(-200);
    }

    // Log slow API calls
    if (duration > 5000) {
      console.warn(`Slow API call detected: ${endpoint} took ${duration}ms`);
    }

    console.log(`API ${endpoint} completed in ${duration}ms (${statusCode})`);
  }

  // Memory Monitoring
  private startMemoryMonitoring(): void {
    this.memoryCheckInterval = setInterval(() => {
      const memoryInfo = this.getCurrentMemoryUsage();
      
      // Log high memory usage
      if (memoryInfo.usagePercentage > 80) {
        console.warn(`High memory usage detected: ${memoryInfo.usagePercentage.toFixed(1)}%`);
      }
    }, 10000); // Check every 10 seconds
  }

  private getCurrentMemoryUsage(): MemoryInfo {
    try {
      // This is a simplified memory calculation
      // In a real app, you'd use more sophisticated memory monitoring
      const deviceMemory = DeviceInfo.getTotalMemory();
      const estimatedUsed = deviceMemory * 0.6; // Rough estimate
      
      return {
        used: estimatedUsed,
        total: deviceMemory,
        free: deviceMemory - estimatedUsed,
        usagePercentage: (estimatedUsed / deviceMemory) * 100,
      };
    } catch (error) {
      return {
        used: 0,
        total: 0,
        free: 0,
        usagePercentage: 0,
      };
    }
  }

  // Frame Rate Monitoring
  private startFrameRateMonitoring(): void {
    if (Platform.OS === 'ios') {
      // iOS frame rate monitoring would be implemented here
      // This is a placeholder for the actual implementation
    }
  }

  private recordFrameRate(frameRate: number): void {
    this.frameRateMetrics.push(frameRate);
    
    // Keep only last 60 frame rate measurements (1 second at 60fps)
    if (this.frameRateMetrics.length > 60) {
      this.frameRateMetrics = this.frameRateMetrics.slice(-60);
    }

    // Log low frame rates
    if (frameRate < 50) {
      console.warn(`Low frame rate detected: ${frameRate}fps`);
    }
  }

  // Bundle Size Analysis
  async getBundleSize(): Promise<number> {
    try {
      // This would typically involve analyzing the bundle file
      // For now, we'll return a placeholder value
      return 15 * 1024 * 1024; // 15MB placeholder
    } catch (error) {
      console.error('Failed to get bundle size:', error);
      return 0;
    }
  }

  // App Launch Time
  async getAppLaunchTime(): Promise<number> {
    try {
      // This would typically be measured from app start
      // For now, we'll return a placeholder value
      return 1500; // 1.5 seconds placeholder
    } catch (error) {
      console.error('Failed to get app launch time:', error);
      return 0;
    }
  }

  // Performance Analytics
  getScreenPerformanceSummary(): {
    averageLoadTime: number;
    slowScreens: string[];
    totalScreenLoads: number;
  } {
    if (this.screenMetrics.length === 0) {
      return {
        averageLoadTime: 0,
        slowScreens: [],
        totalScreenLoads: 0,
      };
    }

    const totalLoadTime = this.screenMetrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    const averageLoadTime = totalLoadTime / this.screenMetrics.length;
    
    const slowScreens = this.screenMetrics
      .filter(metric => metric.loadTime > 2000)
      .map(metric => `${metric.screenName} (${metric.loadTime}ms)`);

    return {
      averageLoadTime: Math.round(averageLoadTime),
      slowScreens,
      totalScreenLoads: this.screenMetrics.length,
    };
  }

  getAPIPerformanceSummary(): {
    averageResponseTime: number;
    slowEndpoints: string[];
    errorRate: number;
    totalAPICalls: number;
  } {
    if (this.apiMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        slowEndpoints: [],
        errorRate: 0,
        totalAPICalls: 0,
      };
    }

    const totalResponseTime = this.apiMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    const averageResponseTime = totalResponseTime / this.apiMetrics.length;
    
    const slowEndpoints = this.apiMetrics
      .filter(metric => metric.duration > 5000)
      .map(metric => `${metric.endpoint} (${metric.duration}ms)`);

    const errorCount = this.apiMetrics.filter(metric => metric.statusCode >= 400).length;
    const errorRate = (errorCount / this.apiMetrics.length) * 100;

    return {
      averageResponseTime: Math.round(averageResponseTime),
      slowEndpoints,
      errorRate: Math.round(errorRate * 100) / 100,
      totalAPICalls: this.apiMetrics.length,
    };
  }

  getMemorySummary(): {
    currentUsage: number;
    peakUsage: number;
    averageUsage: number;
  } {
    const currentMemory = this.getCurrentMemoryUsage();
    
    // Calculate peak and average from screen metrics
    const memoryUsages = this.screenMetrics.map(metric => metric.memoryUsage);
    const peakUsage = memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0;
    const averageUsage = memoryUsages.length > 0 
      ? memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length 
      : 0;

    return {
      currentUsage: currentMemory.usagePercentage,
      peakUsage: peakUsage / (1024 * 1024), // Convert to MB
      averageUsage: averageUsage / (1024 * 1024), // Convert to MB
    };
  }

  // Performance Recommendations
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const screenSummary = this.getScreenPerformanceSummary();
    const apiSummary = this.getAPIPerformanceSummary();
    const memorySummary = this.getMemorySummary();

    // Screen performance recommendations
    if (screenSummary.averageLoadTime > 2000) {
      recommendations.push('Consider optimizing screen load times - average is above 2 seconds');
    }

    if (screenSummary.slowScreens.length > 0) {
      recommendations.push(`Optimize slow screens: ${screenSummary.slowScreens.join(', ')}`);
    }

    // API performance recommendations
    if (apiSummary.averageResponseTime > 3000) {
      recommendations.push('Consider optimizing API response times - average is above 3 seconds');
    }

    if (apiSummary.errorRate > 5) {
      recommendations.push(`High API error rate detected: ${apiSummary.errorRate}%`);
    }

    // Memory recommendations
    if (memorySummary.currentUsage > 80) {
      recommendations.push('High memory usage detected - consider implementing memory optimizations');
    }

    // Bundle size recommendations
    if (Platform.OS === 'android') {
      recommendations.push('Consider implementing code splitting for Android bundle optimization');
    }

    return recommendations;
  }

  // Export performance data
  exportPerformanceData(): {
    screens: ScreenMetrics[];
    apis: APIMetrics[];
    memory: MemoryInfo;
    timestamp: number;
    deviceInfo: {
      platform: string;
      version: string;
      model: string;
      totalMemory: number;
    };
  } {
    return {
      screens: [...this.screenMetrics],
      apis: [...this.apiMetrics],
      memory: this.getCurrentMemoryUsage(),
      timestamp: Date.now(),
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model: DeviceInfo.getModel(),
        totalMemory: DeviceInfo.getTotalMemory(),
      },
    };
  }

  // Clear performance data
  clearPerformanceData(): void {
    this.screenMetrics = [];
    this.apiMetrics = [];
    this.frameRateMetrics = [];
    console.log('Performance data cleared');
  }

  // Cleanup
  destroy(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    this.isMonitoring = false;
  }
}

export const performanceService = new PerformanceService();
