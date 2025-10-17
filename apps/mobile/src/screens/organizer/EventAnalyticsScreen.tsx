import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, Card, useTheme, SegmentedButtons, Button } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { OrganizerStackParamList } from '@/navigation/OrganizerNavigator';
import { theme } from '@/config/theme';
import { Event, EventAnalytics } from '@/types/event.types';
import { eventsService } from '@/services/events.service';

type EventAnalyticsRouteProp = RouteProp<OrganizerStackParamList, 'EventAnalytics'>;

const { width } = Dimensions.get('window');

interface AnalyticsData {
  event: Event;
  analytics: EventAnalytics;
  salesData: Array<{ date: string; sales: number; revenue: number }>;
  ticketTypeData: Array<{ name: string; sold: number; revenue: number }>;
}

export const EventAnalyticsScreen: React.FC = () => {
  const route = useRoute<EventAnalyticsRouteProp>();
  const { eventId } = route.params;
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  
  const { colors } = useTheme();

  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'all', label: 'All Time' },
  ];

  useEffect(() => {
    loadAnalyticsData();
  }, [eventId, selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Load event details
      const eventResponse = await eventsService.getEventById(eventId);
      const event = eventResponse.data;
      
      // Load analytics data
      const analyticsResponse = await eventsService.getEventAnalytics(eventId, {
        period: selectedPeriod,
      });
      const analytics = analyticsResponse.data;
      
      // Mock sales data - in a real app, this would come from the API
      const salesData = generateMockSalesData(selectedPeriod);
      const ticketTypeData = generateMockTicketTypeData(event);
      
      setAnalyticsData({
        event,
        analytics,
        salesData,
        ticketTypeData,
      });
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalyticsData();
    setIsRefreshing(false);
  };

  const generateMockSalesData = (period: string) => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 5000) + 1000,
      });
    }
    
    return data;
  };

  const generateMockTicketTypeData = (event: Event) => {
    return [
      { name: 'General Admission', sold: 150, revenue: 7500 },
      { name: 'VIP', sold: 25, revenue: 5000 },
      { name: 'Early Bird', sold: 75, revenue: 3750 },
    ];
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const renderOverviewCard = () => {
    if (!analyticsData) return null;

    const { event, analytics } = analyticsData;

    return (
      <Card style={styles.overviewCard}>
        <Card.Content>
          <Text style={styles.overviewTitle}>Event Overview</Text>
          
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewStatValue}>{event.ticketsSold || 0}</Text>
              <Text style={styles.overviewStatLabel}>Tickets Sold</Text>
            </View>
            
            <View style={styles.overviewStat}>
              <Text style={styles.overviewStatValue}>{formatCurrency(event.totalRevenue || 0)}</Text>
              <Text style={styles.overviewStatLabel}>Total Revenue</Text>
            </View>
            
            <View style={styles.overviewStat}>
              <Text style={styles.overviewStatValue}>
                {event.maxAttendees ? formatPercentage(((event.ticketsSold || 0) / event.maxAttendees) * 100) : '0%'}
              </Text>
              <Text style={styles.overviewStatLabel}>Capacity</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderPerformanceMetrics = () => {
    if (!analyticsData) return null;

    const { analytics } = analyticsData;

    return (
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Ionicons name="trending-up" size={24} color={theme.colors.primary} />
              <Text style={styles.metricValue}>{analytics.conversionRate || 12.5}%</Text>
              <Text style={styles.metricLabel}>Conversion Rate</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Ionicons name="people" size={24} color={theme.colors.secondary} />
              <Text style={styles.metricValue}>{analytics.uniqueVisitors || 1250}</Text>
              <Text style={styles.metricLabel}>Unique Visitors</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Ionicons name="time" size={24} color={theme.colors.tertiary} />
              <Text style={styles.metricValue}>{analytics.avgSessionTime || 3.2}m</Text>
              <Text style={styles.metricLabel}>Avg. Session</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Ionicons name="refresh" size={24} color={theme.colors.error} />
              <Text style={styles.metricValue}>{analytics.bounceRate || 45.2}%</Text>
              <Text style={styles.metricLabel}>Bounce Rate</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderSalesChart = () => {
    if (!analyticsData) return null;

    const { salesData } = analyticsData;
    const maxSales = Math.max(...salesData.map(d => d.sales));
    const maxRevenue = Math.max(...salesData.map(d => d.revenue));

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Sales Trend</Text>
          
          <View style={styles.chartContainer}>
            {salesData.map((data, index) => {
              const salesHeight = (data.sales / maxSales) * 100;
              const revenueHeight = (data.revenue / maxRevenue) * 100;
              
              return (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, styles.salesBar, { height: `${salesHeight}%` }]} />
                    <View style={[styles.bar, styles.revenueBar, { height: `${revenueHeight}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>
                    {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              );
            })}
          </View>
          
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
              <Text style={styles.legendText}>Sales</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: theme.colors.secondary }]} />
              <Text style={styles.legendText}>Revenue</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderTicketTypeBreakdown = () => {
    if (!analyticsData) return null;

    const { ticketTypeData } = analyticsData;
    const totalSold = ticketTypeData.reduce((sum, type) => sum + type.sold, 0);
    const totalRevenue = ticketTypeData.reduce((sum, type) => sum + type.revenue, 0);

    return (
      <Card style={styles.breakdownCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Ticket Type Breakdown</Text>
          
          {ticketTypeData.map((type, index) => {
            const percentage = totalSold > 0 ? (type.sold / totalSold) * 100 : 0;
            
            return (
              <View key={index} style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownName}>{type.name}</Text>
                  <Text style={styles.breakdownPercentage}>{formatPercentage(percentage)}</Text>
                </View>
                
                <View style={styles.breakdownBar}>
                  <View 
                    style={[
                      styles.breakdownBarFill, 
                      { width: `${percentage}%`, backgroundColor: theme.colors.primary }
                    ]} 
                  />
                </View>
                
                <View style={styles.breakdownStats}>
                  <Text style={styles.breakdownStat}>
                    {type.sold} tickets ({formatCurrency(type.revenue)})
                  </Text>
                </View>
              </View>
            );
          })}
        </Card.Content>
      </Card>
    );
  };

  const renderExportButton = () => (
    <Button
      mode="contained"
      onPress={() => {
        // In a real implementation, this would export analytics data
        console.log('Export analytics data');
      }}
      style={styles.exportButton}
      icon="download"
    >
      Export Report
    </Button>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (!analyticsData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load analytics data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
          buttons={periods}
          style={styles.periodSelector}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {renderOverviewCard()}
        {renderPerformanceMetrics()}
        {renderSalesChart()}
        {renderTicketTypeBreakdown()}
        {renderExportButton()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  periodSelector: {
    marginBottom: theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.onSurface,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.lg,
  },
  overviewCard: {
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  overviewTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.lg,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewStatValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  overviewStatLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  metricsCard: {
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metricItem: {
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSurface,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  metricLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
    opacity: 0.7,
    textAlign: 'center',
  },
  chartCard: {
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    marginBottom: theme.spacing.md,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barContainer: {
    height: '100%',
    width: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bar: {
    width: 8,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  salesBar: {
    backgroundColor: theme.colors.primary,
  },
  revenueBar: {
    backgroundColor: theme.colors.secondary,
  },
  barLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.onSurface,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: theme.spacing.xs,
  },
  legendText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
  },
  breakdownCard: {
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  breakdownItem: {
    marginBottom: theme.spacing.lg,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  breakdownName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.onSurface,
  },
  breakdownPercentage: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  breakdownBar: {
    height: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownStat: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  exportButton: {
    marginBottom: theme.spacing.xl,
  },
});