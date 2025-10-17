import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { AdminStackParamList } from '@/navigation/AdminNavigator';
import { RootState } from '@/store';

type AdminDashboardScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'AdminDashboard'>;

interface SystemMetric {
  title: string;
  value: string | number;
  change: number;
  icon: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

interface QuickActionProps {
  title: string;
  icon: string;
  onPress: () => void;
  color: string;
  badge?: number;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, icon, onPress, color, badge }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
      <Icon name={icon} size={24} color="#fff" />
      {badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
    <Text style={styles.quickActionText}>{title}</Text>
  </TouchableOpacity>
);

interface MetricCardProps {
  metric: SystemMetric;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'trending-flat';
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
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
        <Icon name={metric.icon} size={24} color={metric.color} />
        <View style={styles.metricTrend}>
          <Icon name={getTrendIcon()} size={16} color={getTrendColor()} />
          <Text style={[styles.metricChange, { color: getTrendColor() }]}>
            {metric.change > 0 ? '+' : ''}{metric.change}%
          </Text>
        </View>
      </View>
      <Text style={styles.metricValue}>{metric.value}</Text>
      <Text style={styles.metricTitle}>{metric.title}</Text>
    </View>
  );
};

interface ActivityItemProps {
  activity: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  };
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'user_registration':
        return 'person-add';
      case 'event_created':
        return 'event';
      case 'payment_completed':
        return 'payment';
      case 'venue_verified':
        return 'verified';
      case 'system_alert':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getActivityColor = () => {
    switch (activity.type) {
      case 'user_registration':
        return '#4CAF50';
      case 'event_created':
        return '#2196F3';
      case 'payment_completed':
        return '#FF9800';
      case 'venue_verified':
        return '#9C27B0';
      case 'system_alert':
        return '#FF5722';
      default:
        return theme.colors.primary;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: getActivityColor() }]}>
        <Icon name={getActivityIcon()} size={16} color="#fff" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        <Text style={styles.activityMeta}>
          {activity.user && `${activity.user} • `}{formatTime(activity.timestamp)}
        </Text>
      </View>
    </View>
  );
};

export const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<AdminDashboardScreenNavigationProp>();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy');

  // Mock data - replace with actual API calls
  const [systemMetrics] = useState<SystemMetric[]>([
    {
      title: 'Total Users',
      value: '12,847',
      change: 12.5,
      icon: 'people',
      color: theme.colors.primary,
      trend: 'up',
    },
    {
      title: 'Active Events',
      value: '234',
      change: 8.2,
      icon: 'event',
      color: '#4CAF50',
      trend: 'up',
    },
    {
      title: 'Revenue (MTD)',
      value: 'EGP 2.4M',
      change: -2.1,
      icon: 'attach-money',
      color: '#FF9800',
      trend: 'down',
    },
    {
      title: 'Support Tickets',
      value: '47',
      change: 15.3,
      icon: 'support-agent',
      color: '#FF5722',
      trend: 'up',
    },
  ]);

  const [recentActivities] = useState([
    {
      id: '1',
      type: 'user_registration',
      description: 'New user registered: Ahmed Hassan',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      user: 'System',
    },
    {
      id: '2',
      type: 'event_created',
      description: 'Event "Tech Conference 2024" created by Cairo Convention Center',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      user: 'System',
    },
    {
      id: '3',
      type: 'payment_completed',
      description: 'Payment of EGP 2,500 completed for event ticket',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: 'System',
    },
    {
      id: '4',
      type: 'venue_verified',
      description: 'Venue "Alexandria Opera House" verified',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      user: 'Admin Team',
    },
    {
      id: '5',
      type: 'system_alert',
      description: 'High server load detected on payment processing',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      user: 'System',
    },
  ]);

  const [pendingActions] = useState({
    pendingVerifications: 23,
    pendingEvents: 8,
    pendingSupport: 15,
    pendingVenues: 5,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // dispatch(fetchAdminDashboard());
      // Mock loading
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'users':
        navigation.navigate('UserManagement');
        break;
      case 'verifications':
        navigation.navigate('VerificationQueue');
        break;
      case 'events':
        navigation.navigate('EventModeration');
        break;
      case 'venues':
        navigation.navigate('VenueVerification');
        break;
      case 'analytics':
        navigation.navigate('SystemAnalytics');
        break;
      case 'settings':
        navigation.navigate('SystemSettings');
        break;
      case 'notifications':
        navigation.navigate('NotificationCenter');
        break;
      case 'support':
        navigation.navigate('SupportTickets');
        break;
    }
  };

  const getSystemHealthColor = () => {
    switch (systemHealth) {
      case 'healthy':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'critical':
        return '#FF5722';
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.adminName}>{user?.name || 'Admin'}</Text>
        </View>
        <View style={styles.systemHealth}>
          <View style={[styles.healthIndicator, { backgroundColor: getSystemHealthColor() }]} />
          <Text style={styles.healthText}>
            System {systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)}
          </Text>
        </View>
      </View>

      {/* System Metrics */}
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>System Overview</Text>
        <View style={styles.metricsGrid}>
          {systemMetrics.map((metric, index) => (
            <MetricCard key={index} metric={metric} />
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickAction
            title="User Management"
            icon="people"
            onPress={() => handleQuickAction('users')}
            color={theme.colors.primary}
          />
          <QuickAction
            title="Verifications"
            icon="verified-user"
            onPress={() => handleQuickAction('verifications')}
            color="#4CAF50"
            badge={pendingActions.pendingVerifications}
          />
          <QuickAction
            title="Event Moderation"
            icon="event"
            onPress={() => handleQuickAction('events')}
            color="#2196F3"
            badge={pendingActions.pendingEvents}
          />
          <QuickAction
            title="Venue Verification"
            icon="business"
            onPress={() => handleQuickAction('venues')}
            color="#9C27B0"
            badge={pendingActions.pendingVenues}
          />
          <QuickAction
            title="Analytics"
            icon="analytics"
            onPress={() => handleQuickAction('analytics')}
            color="#FF9800"
          />
          <QuickAction
            title="System Settings"
            icon="settings"
            onPress={() => handleQuickAction('settings')}
            color="#607D8B"
          />
          <QuickAction
            title="Notifications"
            icon="notifications"
            onPress={() => handleQuickAction('notifications')}
            color="#795548"
          />
          <QuickAction
            title="Support Tickets"
            icon="support-agent"
            onPress={() => handleQuickAction('support')}
            color="#FF5722"
            badge={pendingActions.pendingSupport}
          />
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.activitiesSection}>
        <View style={styles.activitiesHeader}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activitiesList}>
          {recentActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </View>
      </View>

      {/* System Alerts */}
      <View style={styles.alertsSection}>
        <Text style={styles.sectionTitle}>System Alerts</Text>
        <View style={styles.alertCard}>
          <Icon name="warning" size={24} color="#FF9800" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>High Server Load</Text>
            <Text style={styles.alertDescription}>
              Payment processing servers are experiencing high load. Consider scaling up.
            </Text>
          </View>
          <TouchableOpacity style={styles.alertAction}>
            <Text style={styles.alertActionText}>View Details</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  adminName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  systemHealth: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  healthText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  metricsContainer: {
    padding: 20,
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
  quickActionsSection: {
    padding: 20,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickAction: {
    alignItems: 'center',
    width: '22%',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  quickActionText: {
    fontSize: 12,
    color: theme.colors.onSurface,
    fontWeight: '500',
    textAlign: 'center',
  },
  activitiesSection: {
    padding: 20,
  },
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  alertsSection: {
    padding: 20,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  alertAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF9800',
    borderRadius: 6,
  },
  alertActionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
});