import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, SegmentedButtons, FAB, Menu, IconButton, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { OrganizerStackParamList } from '@/navigation/OrganizerNavigator';
import { theme } from '@/config/theme';
import { Event } from '@/types/event.types';
import { eventsService } from '@/services/events.service';

type MyEventsNavigationProp = StackNavigationProp<OrganizerStackParamList, 'MyEvents'>;

export const MyEventsScreen: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  
  const navigation = useNavigation<MyEventsNavigationProp>();
  const { colors } = useTheme();

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'completed', label: 'Completed' },
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, selectedTab]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const response = await eventsService.getMyEvents();
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEvents();
    setIsRefreshing(false);
  };

  const filterEvents = () => {
    let filtered = events;

    if (selectedTab !== 'all') {
      filtered = events.filter(event => event.status === selectedTab);
    }

    setFilteredEvents(filtered);
  };

  const handleEventPress = (event: Event) => {
    navigation.navigate('EditEvent', { eventId: event.id });
  };

  const handleViewAnalytics = (event: Event) => {
    navigation.navigate('EventAnalytics', { eventId: event.id });
  };

  const handleManageTickets = (event: Event) => {
    navigation.navigate('TicketTypes', { eventId: event.id });
  };

  const handleViewAttendees = (event: Event) => {
    navigation.navigate('AttendeesList', { eventId: event.id });
  };

  const handleCheckIn = (event: Event) => {
    navigation.navigate('CheckIn', { eventId: event.id });
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'published':
        return theme.colors.primary;
      case 'draft':
        return theme.colors.secondary;
      case 'completed':
        return theme.colors.tertiary;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.onSurface;
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'published':
        return 'check-circle';
      case 'draft':
        return 'edit';
      case 'completed':
        return 'check';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderEventCard = ({ item }: { item: Event }) => {
    const [menuVisible, setMenuVisible] = useState(false);

    const menuItems = [
      {
        title: 'Edit Event',
        icon: 'edit',
        onPress: () => {
          setMenuVisible(false);
          handleEventPress(item);
        },
      },
      {
        title: 'Analytics',
        icon: 'analytics',
        onPress: () => {
          setMenuVisible(false);
          handleViewAnalytics(item);
        },
      },
      {
        title: 'Manage Tickets',
        icon: 'ticket',
        onPress: () => {
          setMenuVisible(false);
          handleManageTickets(item);
        },
      },
      {
        title: 'View Attendees',
        icon: 'people',
        onPress: () => {
          setMenuVisible(false);
          handleViewAttendees(item);
        },
      },
      {
        title: 'Check-In',
        icon: 'check-circle',
        onPress: () => {
          setMenuVisible(false);
          handleCheckIn(item);
        },
      },
    ];

    return (
      <Card style={styles.eventCard}>
        <Card.Content style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={styles.eventTitleContainer}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="more-vert"
                  size={20}
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              {menuItems.map((menuItem, index) => (
                <Menu.Item
                  key={index}
                  onPress={menuItem.onPress}
                  title={menuItem.title}
                  leadingIcon={menuItem.icon}
                />
              ))}
            </Menu>
          </View>
          
          <Text style={styles.eventDate}>
            {formatDate(item.startDate)}
          </Text>
          
          <Text style={styles.eventLocation} numberOfLines={1}>
            {item.venue?.name || 'Venue TBD'}
          </Text>
          
          <View style={styles.eventStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Attendees</Text>
              <Text style={styles.statValue}>
                {item.ticketsSold || 0} / {item.maxAttendees || 0}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={styles.statValue}>
                {formatCurrency(item.totalRevenue || 0)}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={[styles.statValue, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.eventActions}>
            <View style={styles.quickActions}>
              <IconButton
                icon="analytics"
                size={20}
                onPress={() => handleViewAnalytics(item)}
                style={styles.actionButton}
              />
              <IconButton
                icon="ticket"
                size={20}
                onPress={() => handleManageTickets(item)}
                style={styles.actionButton}
              />
              <IconButton
                icon="people"
                size={20}
                onPress={() => handleViewAttendees(item)}
                style={styles.actionButton}
              />
              <IconButton
                icon="check-circle"
                size={20}
                onPress={() => handleCheckIn(item)}
                style={styles.actionButton}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => {
    const getEmptyMessage = () => {
      switch (selectedTab) {
        case 'all':
          return 'No events found';
        case 'draft':
          return 'No draft events';
        case 'published':
          return 'No published events';
        case 'completed':
          return 'No completed events';
        default:
          return 'No events found';
      }
    };

    const getEmptyDescription = () => {
      switch (selectedTab) {
        case 'all':
          return 'Create your first event to get started';
        case 'draft':
          return 'Start creating an event to save as draft';
        case 'published':
          return 'Publish your events to make them visible to attendees';
        case 'completed':
          return 'Completed events will appear here';
        default:
          return 'Try creating a new event';
      }
    };

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>{getEmptyMessage()}</Text>
        <Text style={styles.emptyMessage}>{getEmptyDescription()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={selectedTab}
          onValueChange={setSelectedTab}
          buttons={tabs}
          style={styles.segmentedButtons}
        />
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEventCard}
        contentContainerStyle={styles.eventsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
      />

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
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  segmentedButtons: {
    marginBottom: theme.spacing.sm,
  },
  eventsList: {
    padding: theme.spacing.md,
  },
  eventCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
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
  eventTitleContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  eventTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
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
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  eventLocation: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginBottom: theme.spacing.md,
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.onSurface,
  },
  eventActions: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    paddingTop: theme.spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    marginHorizontal: theme.spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
  },
  emptyMessage: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.onSurface,
    opacity: 0.7,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
  },
});