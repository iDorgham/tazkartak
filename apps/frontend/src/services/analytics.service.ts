import { apiClient } from './api.service';

export interface AnalyticsSummary {
  totalLoads: number;
  totalViews: number;
  totalTicketSelections: number;
  totalCheckouts: number;
  totalPurchases: number;
  totalErrors: number;
  conversionRate: number;
  revenue: number;
}

export interface WidgetAnalytics {
  widgetId: string;
  organizerId: string;
  eventId?: string;
  action: string;
  metadata?: {
    ticketType?: string;
    quantity?: number;
    amount?: number;
    error?: string;
    userAgent?: string;
    referrer?: string;
    ip?: string;
  };
  timestamp: Date;
}

export interface HourlyBreakdown {
  hour: string;
  loads: number;
  views: number;
  purchases: number;
  revenue: number;
}

export interface ConnectedClients {
  widget: number;
  organizer: number;
}

export interface RealtimeDashboardData {
  summary: AnalyticsSummary;
  recentAnalytics: WidgetAnalytics[];
  hourlyBreakdown: HourlyBreakdown[];
  connectedClients: ConnectedClients;
  lastUpdated: Date;
}

export interface ConversionFunnel {
  loads: number;
  views: number;
  ticketSelections: number;
  checkouts: number;
  purchases: number;
  conversionRates: {
    loadToView: number;
    viewToSelection: number;
    selectionToCheckout: number;
    checkoutToPurchase: number;
    overall: number;
  };
}

export class AnalyticsService {
  /**
   * Get widget analytics for an organizer
   */
  async getWidgetAnalytics(params?: {
    eventId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; data: WidgetAnalytics[]; count: number }> {
    const queryParams = new URLSearchParams();
    
    if (params?.eventId) queryParams.append('eventId', params.eventId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await apiClient.get(`/analytics/widget?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get analytics summary for an organizer
   */
  async getAnalyticsSummary(params?: {
    eventId?: string;
  }): Promise<{ success: boolean; data: AnalyticsSummary }> {
    const queryParams = new URLSearchParams();
    
    if (params?.eventId) queryParams.append('eventId', params.eventId);

    const response = await apiClient.get(`/analytics/summary?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get real-time analytics dashboard data
   */
  async getRealtimeDashboard(params?: {
    eventId?: string;
  }): Promise<{ success: boolean; data: RealtimeDashboardData }> {
    const queryParams = new URLSearchParams();
    
    if (params?.eventId) queryParams.append('eventId', params.eventId);

    const response = await apiClient.get(`/analytics/dashboard?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Track custom analytics event
   */
  async trackCustomEvent(data: {
    action: string;
    eventId?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/analytics/track', data);
    return response.data;
  }

  /**
   * Get analytics for a specific event
   */
  async getEventAnalytics(
    eventId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    success: boolean;
    data: {
      analytics: WidgetAnalytics[];
      summary: AnalyticsSummary;
      funnel: ConversionFunnel;
      count: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await apiClient.get(`/analytics/events/${eventId}?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get analytics export data
   */
  async exportAnalytics(params?: {
    eventId?: string;
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'json' | 'xlsx';
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    if (params?.eventId) queryParams.append('eventId', params.eventId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.format) queryParams.append('format', params.format);

    const response = await apiClient.get(`/analytics/export?${queryParams.toString()}`, {
      responseType: 'blob',
    });

    return response.data;
  }

  /**
   * Get analytics insights and recommendations
   */
  async getAnalyticsInsights(params?: {
    eventId?: string;
  }): Promise<{
    success: boolean;
    data: {
      insights: string[];
      recommendations: string[];
      trends: {
        period: string;
        metric: string;
        value: number;
        change: number;
      }[];
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.eventId) queryParams.append('eventId', params.eventId);

    const response = await apiClient.get(`/analytics/insights?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get real-time metrics for monitoring
   */
  async getRealtimeMetrics(): Promise<{
    success: boolean;
    data: {
      activeUsers: number;
      currentRevenue: number;
      conversionRate: number;
      averageSessionDuration: number;
      topEvents: {
        eventId: string;
        eventName: string;
        views: number;
        purchases: number;
        revenue: number;
      }[];
    };
  }> {
    const response = await apiClient.get('/analytics/realtime-metrics');
    return response.data;
  }

  /**
   * Get analytics comparison data
   */
  async getAnalyticsComparison(params: {
    period: 'day' | 'week' | 'month';
    compareWith: 'previous' | 'last_year';
  }): Promise<{
    success: boolean;
    data: {
      current: AnalyticsSummary;
      previous: AnalyticsSummary;
      changes: {
        totalLoads: number;
        totalViews: number;
        totalPurchases: number;
        conversionRate: number;
        revenue: number;
      };
    };
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append('period', params.period);
    queryParams.append('compareWith', params.compareWith);

    const response = await apiClient.get(`/analytics/comparison?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get geographic analytics data
   */
  async getGeographicAnalytics(params?: {
    eventId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    success: boolean;
    data: {
      countries: {
        country: string;
        users: number;
        revenue: number;
      }[];
      cities: {
        city: string;
        country: string;
        users: number;
        revenue: number;
      }[];
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.eventId) queryParams.append('eventId', params.eventId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await apiClient.get(`/analytics/geographic?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get device and browser analytics
   */
  async getDeviceAnalytics(params?: {
    eventId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    success: boolean;
    data: {
      devices: {
        device: string;
        count: number;
        percentage: number;
      }[];
      browsers: {
        browser: string;
        count: number;
        percentage: number;
      }[];
      operatingSystems: {
        os: string;
        count: number;
        percentage: number;
      }[];
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.eventId) queryParams.append('eventId', params.eventId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await apiClient.get(`/analytics/devices?${queryParams.toString()}`);
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
