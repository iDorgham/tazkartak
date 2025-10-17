import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, useTheme, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { OrganizerStackParamList } from '@/navigation/OrganizerNavigator';
import { theme } from '@/config/theme';
import { Event, EventStats } from '@/types/event.types';
import { eventsService } from '@/services/events.service';

type OrganizerDashboardNavigationProp = StackNavigationProp<OrganizerStackParamList, 'OrganizerDashboard'>;

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
  upcomingEvents: number;
  completedEvents: number;
}

interface QuickAction {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
  color: string;
}

export const OrganizerDashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalRevenue: 0,
    totalTicketsSold: 0,
    upcomingEvents: 0,
    completedEvents: 0,
  });
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const navigation = useNavigation<OrganizerDashboardNavigationProp>();
  const { colors } = useTheme();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load organizer's events
      const eventsResponse = await eventsService.getMyEvents();
      const events = eventsResponse.data;
      
      // Calculate stats
      const totalEvents = events.length;
      const activeEvents = events.filter(e => e.status === 'published').length;
      const upcomingEvents = events.filter(e => 
        e.status === 'published' && new Date(e.startDate) > new Date()
      ).length;
      const completedEvents = events.filter(e => 
        e.status === 'completed' || new Date(e.endDate) < new Date()
      ).length;
      
      const totalRevenue = events.reduce((sum, event) => sum + (event.totalRevenue || 0), 0);
      const totalTicketsSold = events.reduce((sum, event) => sum + (event.ticketsSold || 0), 0);
      
      setStats({
        totalEvents,
        activeEvents,
        totalRevenue,
        totalTicketsSold,
        upcomingEvents,
        completedEvents,
      });
      
      // Set recent events (last 5)
      setRecentEvents(events.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Create Event',
      subtitle: 'Start a new event',
      icon: 'add-circle',
      onPress: () => navigation.navigate('CreateEvent'),
      color: theme.colors.primary,
    },
    {
      title: 'My Events',
      subtitle: 'Manage existing events',
      icon: 'calendar',
      onPress: () => navigation.navigate('MyEvents'),
      color: theme.colors.secondary,
    },
    {
      title: 'Analytics',
      subtitle: 'View event insights',
      icon: 'analytics',
      onPress: () => {
        // Navigate to first event analytics if available
        if (recentEvents.length > 0) {
          navigation.navigate('EventAnalytics', { eventId: recentEvents[0].id });
        }
      },
      color: theme.colors.tertiary,
    },
    {
      title: 'Subscription',
      subtitle: 'Manage your plan',
      icon: 'card',
      onPress: () => navigation.navigate('Subscription'),
      color: theme.colors.error,
    },
  ];

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStatCard = (title: string, value: string | number, subtitle?: string, icon?: string) => (
    <Card style={styles.statCard} key={title}>
      <Card.Content style={styles.statContent}>
        {icon && (
          <Ionicons 
            name={icon as any} 
            size={24} 
            color={theme.colors.primary} 
            style={styles.statIcon}
          />
        )}
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.statSubtitle}>{subtitle}</Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderQuickAction = (action: QuickAction) => (
    <Card
      style={[styles.actionCard, { borderLeftColor: action.color }]}
      key={action.title}
      onPress={action.onPress}
    >
      <Card.Content style={styles.actionContent}>
        <Ionicons 
          name={action.icon as any} 
          size={32} 
          color={action.color} 
          style={styles.actionIcon}
        />
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>{action.title}</Text>
          <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={theme.colors.onSurface} 
          style={styles.chevronIcon}
        />
      </Card.Content>
    </Card>
  );

  const renderRecentEvent = (event: Event) => (
    <Card
      key={event.id}
      style={styles.eventCard}
      onPress={() => navigation.navigate('EditEvent', { eventId: event.id })}
    >
      <Card.Content style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={[styles.statusBadge, { 
            backgroundColor: event.status === 'published' ? theme.colors.primary : theme.colors.secondary 
          }]}>
            <Text style={styles.statusText}>
              {event.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.eventDate}>
          {formatDate(event.startDate)}
        </Text>
        
        <View style={styles.eventStats}>
          <Text style={styles.eventStat}>
            {event.ticketsSold || 0} tickets sold
          </Text>
          <Text style={styles.eventRevenue}>
            {formatCurrency(event.totalRevenue || 0)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
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
        {/* Welcome Section */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text style={styles.welcomeTitle}>Welcome back!</Text>
            <Text style={styles.welcomeSubtitle}>
              Here's what's happening with your events
            </Text>
          </Card.Content>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Total Events', stats.totalEvents, `${stats.activeEvents} active`, 'calendar-outline')}
            {renderStatCard('Upcoming', stats.upcomingEvents, `${stats.completedEvents} completed`, 'time-outline')}
            {renderStatCard('Revenue', formatCurrency(stats.totalRevenue), 'Total earnings', 'cash-outline')}
            {renderStatCard('Tickets Sold', stats.totalTicketsSold, 'All time', 'ticket-outline')}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {quickActions.map(renderQuickAction)}
        </View>

        {/* Recent Events */}
        <View style={styles.eventsContainer}>
          <View style={styles.eventsHeader}>
            <Text style={styles.sectionTitle}>Recent Events</Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('MyEvents')}
              compact
            >
              View All
            </Button>
          </View>
          
          {recentEvents.length > 0 ? (
            recentEvents.map(renderRecentEvent)
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Ionicons 
                  name="calendar-outline" 
                  size={48} 
                  color={theme.colors.onSurface} 
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>No events yet</Text>
                <Text style={styles.emptyMessage}>
                  Create your first event to get started
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('CreateEvent')}
                  style={styles.emptyButton}
                >
                  Create Event
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateEvent')}
        label="Create Event"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  welcomeCard: {
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md,
  },
  statsContainer: {
    marginBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    elevation: 1,
  },
  statContent: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  statIcon: {
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.onSurface,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  actionsContainer: {
    marginBottom: theme.spacing.lg,
  },
  actionCard: {
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
    elevation: 1,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  actionIcon: {
    marginRight: theme.spacing.md,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  actionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  chevronIcon: {
    opacity: 0.5,
  },
  eventsContainer: {
    marginBottom: theme.spacing.xl,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  eventCard: {
    marginBottom: theme.spacing.sm,
    elevation: 1,
  },
  eventContent: {
    padding: theme.spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  eventTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.onSurface,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onPrimary,
  },
  eventDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventStat: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  eventRevenue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.primary,
  },
  emptyCard: {
    elevation: 1,
  },
  emptyContent: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    marginBottom: theme.spacing.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
  },
  emptyMessage: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.onSurface,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
  },
});