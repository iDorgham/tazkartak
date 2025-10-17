import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, SegmentedButtons, FAB, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { BuyerStackParamList } from '@/navigation/BuyerNavigator';
import { theme } from '@/config/theme';
import { Ticket } from '@/types/ticket.types';
import { ticketsService } from '@/services/tickets.service';

type MyTicketsScreenNavigationProp = StackNavigationProp<BuyerStackParamList, 'MyTickets'>;

interface TicketWithEvent extends Ticket {
  event?: {
    title: string;
    imageUrl?: string;
    venue?: {
      name: string;
    };
  };
}

export const MyTicketsScreen: React.FC = () => {
  const [tickets, setTickets] = useState<TicketWithEvent[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  
  const navigation = useNavigation<MyTicketsScreenNavigationProp>();
  const { colors } = useTheme();

  const tabs = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, selectedTab]);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const response = await ticketsService.getMyTickets();
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTickets();
    setIsRefreshing(false);
  };

  const filterTickets = () => {
    const now = new Date();
    let filtered = tickets;

    switch (selectedTab) {
      case 'upcoming':
        filtered = tickets.filter(ticket => 
          ticket.status === 'confirmed' && 
          new Date(ticket.event?.startDate || '') > now
        );
        break;
      case 'past':
        filtered = tickets.filter(ticket => 
          ticket.status === 'confirmed' && 
          new Date(ticket.event?.startDate || '') <= now
        );
        break;
      case 'cancelled':
        filtered = tickets.filter(ticket => 
          ticket.status === 'cancelled' || ticket.status === 'refunded'
        );
        break;
    }

    setFilteredTickets(filtered);
  };

  const handleTicketPress = (ticket: TicketWithEvent) => {
    navigation.navigate('TicketDetail', { ticketId: ticket.id });
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return theme.colors.primary;
      case 'cancelled':
      case 'refunded':
        return theme.colors.error;
      case 'pending':
        return theme.colors.warning;
      default:
        return theme.colors.onSurface;
    }
  };

  const renderTicketCard = ({ item }: { item: TicketWithEvent }) => (
    <Card
      style={styles.ticketCard}
      onPress={() => handleTicketPress(item)}
    >
      <Card.Content style={styles.ticketContent}>
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketTitle} numberOfLines={2}>
            {item.event?.title || 'Event Title'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.eventDate}>
          {formatDate(item.event?.startDate || '')}
        </Text>
        
        <Text style={styles.venueName} numberOfLines={1}>
          {item.event?.venue?.name || 'Venue'}
        </Text>
        
        <View style={styles.ticketFooter}>
          <Text style={styles.ticketType}>
            {item.ticketType?.name || 'General Admission'}
          </Text>
          <Text style={styles.ticketPrice}>
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EGP',
            }).format(item.price)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => {
    const getEmptyMessage = () => {
      switch (selectedTab) {
        case 'upcoming':
          return 'No upcoming events';
        case 'past':
          return 'No past events';
        case 'cancelled':
          return 'No cancelled tickets';
        default:
          return 'No tickets found';
      }
    };

    const getEmptyDescription = () => {
      switch (selectedTab) {
        case 'upcoming':
          return 'Your upcoming events will appear here';
        case 'past':
          return 'Your past events will appear here';
        case 'cancelled':
          return 'Your cancelled tickets will appear here';
        default:
          return 'Try purchasing some tickets';
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
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        renderItem={renderTicketCard}
        contentContainerStyle={styles.ticketsList}
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
        onPress={() => {
          // Navigate to events list to purchase tickets
          navigation.navigate('EventsList');
        }}
        label="Buy Tickets"
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
  ticketsList: {
    padding: theme.spacing.md,
  },
  ticketCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  ticketContent: {
    padding: theme.spacing.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  ticketTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
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
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  venueName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginBottom: theme.spacing.sm,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketType: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
  ticketPrice: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
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