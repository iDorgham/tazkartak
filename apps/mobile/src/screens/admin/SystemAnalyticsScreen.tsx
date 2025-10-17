import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { AdminStackParamList } from '@/navigation/AdminNavigator';

type SystemAnalyticsScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'SystemAnalytics'>;

const { width } = Dimensions.get('window');

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color, trend }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'trending-flat';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return '#4CAF50';
      case 'down':
        return '#FF5722';
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Icon name={icon} size={24} color={color} />
        <View style={styles.metricTrend}>
          <Icon name={getTrendIcon()} size={16} color={getTrendColor()} />
          <Text style={[styles.metricChange, { color: getTrendColor() }]}>
            {change > 0 ? '+' : ''}{change}%
          </Text>
        </View>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );
};

interface ChartPlaceholderProps {
  title: string;
  height?: number;
}

const ChartPlaceholder: React.FC<ChartPlaceholderProps> = ({ title, height = 200 }) => (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>{title}</Text>
    <View style={[styles.chartPlaceholder, { height }]}>
      <Icon name="bar-chart" size={48} color={theme.colors.outline} />
      <Text style={styles.chartPlaceholderText}>Chart visualization</Text>
    </View>
  </View>
);

interface TopListItemProps {
  rank: number;
  name: string;
  value: string | number;
  change?: number;
}

const TopListItem: React.FC<TopListItemProps> = ({ rank, name, value, change }) => (
  <View style={styles.topListItem}>
    <View style={styles.rankBadge}>
      <Text style={styles.rankText}>{rank}</Text>
    </View>
    <View style={styles.itemInfo}>
      <Text style={styles.itemName}>{name}</Text>
      {change !== undefined && (
        <Text style={[styles.itemChange, { color: change > 0 ? '#4CAF50' : '#FF5722' }]}>
          {change > 0 ? '+' : ''}{change}%
        </Text>
      )}
    </View>
    <Text style={styles.itemValue}>{value}</Text>
  </View>
);

export const SystemAnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<SystemAnalyticsScreenNavigationProp>();
  const dispatch = useDispatch();

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const [systemMetrics] = useState<MetricCardProps[]>([
    {
      title: 'Total Revenue',
      value: 'EGP 2.4M',
      change: 12.5,
      icon: 'attach-money',
      color: '#4CAF50',
      trend: 'up',
    },
    {
      title: 'Active Users',
      value: '12,847',
      change: 8.2,
      icon: 'people',
      color: theme.colors.primary,
      trend: 'up',
    },
    {
      title: 'Events Created',
      value: '234',
      change: -2.1,
      icon: 'event',
      color: '#2196F3',
      trend: 'down',
    },
    {
      title: 'Tickets Sold',
      value: '45,672',
      change: 15.3,
      icon: 'confirmation-number',
      color: '#FF9800',
      trend: 'up',
    },
    {
      title: 'Platform Fee',
      value: 'EGP 120K',
      change: 18.7,
      icon: 'account-balance',
      color: '#9C27B0',
      trend: 'up',
    },
    {
      title: 'Support Tickets',
      value: '47',
      change: -5.2,
      icon: 'support-agent',
      color: '#FF5722',
      trend: 'down',
    },
  ]);

  const [topEvents] = useState<TopListItemProps[]>([
    { rank: 1, name: 'Tech Conference 2024', value: '2,450 tickets', change: 25.3 },
    { rank: 2, name: 'Music Festival Cairo', value: '1,890 tickets', change: 18.7 },
    { rank: 3, name: 'Startup Pitch Event', value: '1,234 tickets', change: 12.1 },
    { rank: 4, name: 'Art Exhibition', value: '987 tickets', change: -2.3 },
    { rank: 5, name: 'Food Festival', value: '756 tickets', change: 8.9 },
  ]);

  const [topVenues] = useState<TopListItemProps[]>([
    { rank: 1, name: 'Cairo Convention Center', value: '15 events', change: 22.1 },
    { rank: 2, name: 'Alexandria Opera House', value: '12 events', change: 18.5 },
    { rank: 3, name: 'Giza Pyramids Complex', value: '8 events', change: 15.2 },
    { rank: 4, name: 'Nile Hilton Hotel', value: '6 events', change: -5.1 },
    { rank: 5, name: 'Sharm El Sheikh Resort', value: '4 events', change: 12.8 },
  ]);

  const [topOrganizers] = useState<TopListItemProps[]>([
    { rank: 1, name: 'Tech Events Egypt', value: 'EGP 456K revenue', change: 28.3 },
    { rank: 2, name: 'Cultural Events Cairo', value: 'EGP 234K revenue', change: 15.7 },
    { rank: 3, name: 'Music Promotions Co.', value: 'EGP 189K revenue', change: 22.1 },
    { rank: 4, name: 'Art Gallery Network', value: 'EGP 123K revenue', change: -3.2 },
    { rank: 5, name: 'Sports Events Ltd', value: 'EGP 98K revenue', change: 18.9 },
  ]);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // dispatch(fetchSystemAnalytics({ timeRange }));
      // Mock loading
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (range: '7d' | '30d' | '90d' | '1y') => {
    setTimeRange(range);
  };

  const handleExportData = () => {
    // Implement export functionality
    console.log('Exporting analytics data...');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <Text style={styles.timeRangeLabel}>Time Range:</Text>
        <View style={styles.timeRangeButtons}>
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => handleTimeRangeChange(range)}
            >
              <Text
                style={[
                  styles.timeRangeButtonText,
                  timeRange === range && styles.timeRangeButtonTextActive,
                ]}
              >
                {range === '7d' ? '7 Days' : 
                 range === '30d' ? '30 Days' :
                 range === '90d' ? '90 Days' : '1 Year'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportData}>
          <Icon name="download" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          {systemMetrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </View>
      </View>

      {/* Revenue Chart */}
      <ChartPlaceholder title="Revenue Trend" />

      {/* User Growth Chart */}
      <ChartPlaceholder title="User Growth" />

      {/* Top Events */}
      <View style={styles.topListSection}>
        <Text style={styles.sectionTitle}>Top Events by Ticket Sales</Text>
        <View style={styles.topListContainer}>
          {topEvents.map((event) => (
            <TopListItem key={event.rank} {...event} />
          ))}
        </View>
      </View>

      {/* Top Venues */}
      <View style={styles.topListSection}>
        <Text style={styles.sectionTitle}>Top Venues by Events</Text>
        <View style={styles.topListContainer}>
          {topVenues.map((venue) => (
            <TopListItem key={venue.rank} {...venue} />
          ))}
        </View>
      </View>

      {/* Top Organizers */}
      <View style={styles.topListSection}>
        <Text style={styles.sectionTitle}>Top Organizers by Revenue</Text>
        <View style={styles.topListContainer}>
          {topOrganizers.map((organizer) => (
            <TopListItem key={organizer.rank} {...organizer} />
          ))}
        </View>
      </View>

      {/* Geographic Distribution Chart */}
      <ChartPlaceholder title="Geographic Distribution" />

      {/* Platform Health Metrics */}
      <View style={styles.healthSection}>
        <Text style={styles.sectionTitle}>Platform Health</Text>
        <View style={styles.healthMetrics}>
          <View style={styles.healthMetric}>
            <Text style={styles.healthLabel}>Server Uptime</Text>
            <Text style={styles.healthValue}>99.9%</Text>
            <View style={styles.healthBar}>
              <View style={[styles.healthBarFill, { width: '99.9%', backgroundColor: '#4CAF50' }]} />
            </View>
          </View>
          
          <View style={styles.healthMetric}>
            <Text style={styles.healthLabel}>API Response Time</Text>
            <Text style={styles.healthValue}>145ms</Text>
            <View style={styles.healthBar}>
              <View style={[styles.healthBarFill, { width: '85%', backgroundColor: '#4CAF50' }]} />
            </View>
          </View>
          
          <View style={styles.healthMetric}>
            <Text style={styles.healthLabel}>Payment Success Rate</Text>
            <Text style={styles.healthValue}>98.7%</Text>
            <View style={styles.healthBar}>
              <View style={[styles.healthBarFill, { width: '98.7%', backgroundColor: '#4CAF50' }]} />
            </View>
          </View>
          
          <View style={styles.healthMetric}>
            <Text style={styles.healthLabel}>Error Rate</Text>
            <Text style={styles.healthValue}>0.3%</Text>
            <View style={styles.healthBar}>
              <View style={[styles.healthBarFill, { width: '97%', backgroundColor: '#4CAF50' }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Performance Insights */}
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Performance Insights</Text>
        <View style={styles.insightsList}>
          <View style={styles.insightItem}>
            <Icon name="trending-up" size={24} color="#4CAF50" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Revenue Growth</Text>
              <Text style={styles.insightDescription}>
                Revenue increased by 12.5% compared to last period
              </Text>
            </View>
          </View>
          
          <View style={styles.insightItem}>
            <Icon name="people" size={24} color="#2196F3" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>User Engagement</Text>
              <Text style={styles.insightDescription}>
                Active users increased by 8.2%, showing strong platform adoption
              </Text>
            </View>
          </View>
          
          <View style={styles.insightItem}>
            <Icon name="warning" size={24} color="#FF9800" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Event Creation Decline</Text>
              <Text style={styles.insightDescription}>
                Event creation decreased by 2.1%, may need investigation
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeRangeLabel: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginRight: 12,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
  },
  timeRangeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  timeRangeButtonTextActive: {
    color: theme.colors.onPrimary,
  },
  exportButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
  },
  metricsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  chartContainer: {
    margin: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  chartPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  topListSection: {
    margin: 16,
  },
  topListContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemValue: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  healthSection: {
    margin: 16,
  },
  healthMetrics: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  healthMetric: {
    marginBottom: 16,
  },
  healthLabel: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  healthBar: {
    height: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  insightsSection: {
    margin: 16,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
});
