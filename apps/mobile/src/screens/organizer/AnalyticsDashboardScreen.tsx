import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, useTheme, ActivityIndicator } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useAnalytics } from '@/hooks/useAnalytics';
import { analyticsService } from '@/services/analytics.service';
import { performanceService } from '@/services/performance.service';
import { theme } from '@/config/theme';

const screenWidth = Dimensions.get('window').width;

interface AnalyticsData {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  activeUsers: number;
  eventViews: Array<{ date: string; views: number }>;
  ticketSales: Array<{ date: string; sales: number }>;
  revenueData: Array<{ date: string; revenue: number }>;
  topEvents: Array<{ name: string; sales: number; revenue: number }>;
  userEngagement: Array<{ action: string; count: number }>;
  performanceMetrics: {
    averageScreenLoadTime: number;
    averageAPICallTime: number;
    errorRate: number;
    crashRate: number;
  };
}

export const AnalyticsDashboardScreen: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const { colors } = useTheme();
  const { trackButtonClick, trackScreenView } = useAnalytics({
    screenName: 'AnalyticsDashboard',
    trackScreenViews: true,
    trackUserActions: true,
  });

  useEffect(() => {
    trackScreenView('AnalyticsDashboard');
    loadAnalyticsData();
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call to get analytics data
      // In a real app, this would come from your backend
      const mockData: AnalyticsData = {
        totalEvents: 24,
        totalTicketsSold: 1847,
        totalRevenue: 92450,
        activeUsers: 156,
        eventViews: [
          { date: '2024-01-01', views: 120 },
          { date: '2024-01-02', views: 135 },
          { date: '2024-01-03', views: 98 },
          { date: '2024-01-04', views: 167 },
          { date: '2024-01-05', views: 189 },
          { date: '2024-01-06', views: 145 },
          { date: '2024-01-07', views: 203 },
        ],
        ticketSales: [
          { date: '2024-01-01', sales: 45 },
          { date: '2024-01-02', sales: 52 },
          { date: '2024-01-03', sales: 38 },
          { date: '2024-01-04', sales: 67 },
          { date: '2024-01-05', sales: 73 },
          { date: '2024-01-06', sales: 58 },
          { date: '2024-01-07', sales: 89 },
        ],
        revenueData: [
          { date: '2024-01-01', revenue: 2250 },
          { date: '2024-01-02', revenue: 2600 },
          { date: '2024-01-03', revenue: 1900 },
          { date: '2024-01-04', revenue: 3350 },
          { date: '2024-01-05', revenue: 3650 },
          { date: '2024-01-06', revenue: 2900 },
          { date: '2024-01-07', revenue: 4450 },
        ],
        topEvents: [
          { name: 'Tech Conference 2024', sales: 456, revenue: 22800 },
          { name: 'Music Festival', sales: 389, revenue: 19450 },
          { name: 'Art Exhibition', sales: 234, revenue: 11700 },
          { name: 'Sports Tournament', sales: 198, revenue: 9900 },
        ],
        userEngagement: [
          { action: 'Event Views', count: 2847 },
          { action: 'Ticket Purchases', count: 1847 },
          { action: 'QR Scans', count: 1456 },
          { action: 'Shares', count: 234 },
          { action: 'Favorites', count: 567 },
        ],
        performanceMetrics: {
          averageScreenLoadTime: 1250,
          averageAPICallTime: 850,
          errorRate: 0.5,
          crashRate: 0.1,
        },
      };

      // Get real performance metrics
      const performanceSummary = performanceService.getScreenPerformanceSummary();
      const apiSummary = performanceService.getAPIPerformanceSummary();
      
      mockData.performanceMetrics = {
        averageScreenLoadTime: performanceSummary.averageLoadTime,
        averageAPICallTime: apiSummary.averageResponseTime,
        errorRate: apiSummary.errorRate,
        crashRate: 0.1, // Would come from crash reporting service
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalyticsData();
  };

  const handlePeriodChange = (period: '7d' | '30d' | '90d') => {
    setSelectedPeriod(period);
    trackButtonClick('PeriodFilter', { period });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (!analyticsData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load analytics data</Text>
        <Button mode="contained" onPress={loadAnalyticsData}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
    >
      {/* Period Filter */}
      <View style={styles.periodFilter}>
        <Chip
          selected={selectedPeriod === '7d'}
          onPress={() => handlePeriodChange('7d')}
          style={styles.periodChip}
        >
          7 Days
        </Chip>
        <Chip
          selected={selectedPeriod === '30d'}
          onPress={() => handlePeriodChange('30d')}
          style={styles.periodChip}
        >
          30 Days
        </Chip>
        <Chip
          selected={selectedPeriod === '90d'}
          onPress={() => handlePeriodChange('90d')}
          style={styles.periodChip}
        >
          90 Days
        </Chip>
      </View>

      {/* Key Metrics */}
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{analyticsData.totalEvents}</Text>
              <Text style={styles.metricLabel}>Total Events</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{formatNumber(analyticsData.totalTicketsSold)}</Text>
              <Text style={styles.metricLabel}>Tickets Sold</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{formatCurrency(analyticsData.totalRevenue)}</Text>
              <Text style={styles.metricLabel}>Revenue</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{formatNumber(analyticsData.activeUsers)}</Text>
              <Text style={styles.metricLabel}>Active Users</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Event Views Chart */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Event Views</Text>
          <LineChart
            data={{
              labels: analyticsData.eventViews.map(item => 
                new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              ),
              datasets: [{
                data: analyticsData.eventViews.map(item => item.views),
                color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                strokeWidth: 2,
              }],
            }}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Ticket Sales Chart */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Ticket Sales</Text>
          <BarChart
            data={{
              labels: analyticsData.ticketSales.map(item => 
                new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              ),
              datasets: [{
                data: analyticsData.ticketSales.map(item => item.sales),
              }],
            }}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 150, 136, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Top Events */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Top Performing Events</Text>
          {analyticsData.topEvents.map((event, index) => (
            <View key={index} style={styles.eventItem}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{event.name}</Text>
                <Text style={styles.eventStats}>
                  {formatNumber(event.sales)} tickets • {formatCurrency(event.revenue)}
                </Text>
              </View>
              <Text style={styles.eventRank}>#{index + 1}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Performance Metrics */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>App Performance</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>
                {analyticsData.performanceMetrics.averageScreenLoadTime}ms
              </Text>
              <Text style={styles.performanceLabel}>Avg Screen Load</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>
                {analyticsData.performanceMetrics.averageAPICallTime}ms
              </Text>
              <Text style={styles.performanceLabel}>Avg API Call</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>
                {analyticsData.performanceMetrics.errorRate}%
              </Text>
              <Text style={styles.performanceLabel}>Error Rate</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>
                {analyticsData.performanceMetrics.crashRate}%
              </Text>
              <Text style={styles.performanceLabel}>Crash Rate</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.onBackground,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    color: theme.colors.error,
  },
  periodFilter: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  periodChip: {
    marginRight: 8,
  },
  metricsCard: {
    margin: 16,
    marginTop: 0,
  },
  chartCard: {
    margin: 16,
    marginTop: 0,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.onSurface,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  metricLabel: {
    fontSize: 14,
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  eventStats: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  eventRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.secondary,
  },
  performanceLabel: {
    fontSize: 12,
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
});

export default AnalyticsDashboardScreen;
