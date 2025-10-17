import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { VenueStackParamList } from '@/navigation/VenueNavigator';
import { RootState } from '@/store';
import { Venue } from '@/types/venue.types';

type VenueListScreenNavigationProp = StackNavigationProp<VenueStackParamList, 'VenueList'>;

interface VenueCardProps {
  venue: Venue;
  onPress: (venue: Venue) => void;
}

const VenueCard: React.FC<VenueCardProps> = ({ venue, onPress }) => {
  const formatAddress = () => {
    return `${venue.city}, ${venue.country}`;
  };

  return (
    <TouchableOpacity
      style={styles.venueCard}
      onPress={() => onPress(venue)}
      activeOpacity={0.7}
    >
      <View style={styles.venueHeader}>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueAddress}>{formatAddress()}</Text>
          <Text style={styles.venueType}>{venue.type}</Text>
        </View>
        <View style={styles.venueStatus}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: venue.isActive ? '#4CAF50' : '#FF5722' },
            ]}
          >
            <Text style={styles.statusText}>
              {venue.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.venueStats}>
        <View style={styles.statItem}>
          <Icon name="people" size={16} color={theme.colors.primary} />
          <Text style={styles.statText}>Capacity: {venue.capacity}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="event" size={16} color={theme.colors.primary} />
          <Text style={styles.statText}>
            {venue.upcomingEvents || 0} Upcoming
          </Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="check-circle" size={16} color={theme.colors.primary} />
          <Text style={styles.statText}>
            {venue.totalCheckIns || 0} Check-ins
          </Text>
        </View>
      </View>
      
      <View style={styles.venueActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="edit" size={16} color={theme.colors.primary} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="qr-code-scanner" size={16} color={theme.colors.primary} />
          <Text style={styles.actionText}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="people" size={16} color={theme.colors.primary} />
          <Text style={styles.actionText}>Team</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => (
  <View style={styles.statsCard}>
    <Icon name={icon} size={24} color={color} />
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsTitle}>{title}</Text>
  </View>
);

export const VenueListScreen: React.FC = () => {
  const navigation = useNavigation<VenueListScreenNavigationProp>();
  const dispatch = useDispatch();
  const { venues, loading, error } = useSelector((state: RootState) => state.venues);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    // Load venues on component mount
    // dispatch(fetchMyVenues());
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // dispatch(fetchMyVenues());
    } catch (error) {
      console.error('Failed to refresh venues:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleVenuePress = (venue: Venue) => {
    navigation.navigate('VenueDetails', { venueId: venue.id });
  };

  const handleCreateVenue = () => {
    navigation.navigate('CreateVenue');
  };

  const filteredVenues = venues.filter(venue => {
    switch (filter) {
      case 'active':
        return venue.isActive;
      case 'inactive':
        return !venue.isActive;
      default:
        return true;
    }
  });

  const totalCapacity = venues.reduce((sum, venue) => sum + venue.capacity, 0);
  const activeVenues = venues.filter(venue => venue.isActive).length;
  const totalEvents = venues.reduce((sum, venue) => sum + (venue.upcomingEvents || 0), 0);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="location-on" size={64} color={theme.colors.outline} />
      <Text style={styles.emptyTitle}>No Venues Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first venue to start managing events
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateVenue}>
        <Icon name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create First Venue</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && venues.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading venues...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Cards */}
      {venues.length > 0 && (
        <View style={styles.statsContainer}>
          <StatsCard
            title="Total Venues"
            value={venues.length}
            icon="location-on"
            color={theme.colors.primary}
          />
          <StatsCard
            title="Total Capacity"
            value={totalCapacity.toLocaleString()}
            icon="people"
            color="#4CAF50"
          />
          <StatsCard
            title="Active Events"
            value={totalEvents}
            icon="event"
            color="#FF9800"
          />
        </View>
      )}

      {/* Filter Buttons */}
      {venues.length > 0 && (
        <View style={styles.filterContainer}>
          {(['all', 'active', 'inactive'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                filter === filterType && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === filterType && styles.filterButtonTextActive,
                ]}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Venues List */}
      <FlatList
        data={filteredVenues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VenueCard venue={item} onPress={handleVenuePress} />
        )}
        contentContainerStyle={[
          styles.listContainer,
          filteredVenues.length === 0 && styles.emptyListContainer,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      {venues.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateVenue}>
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 4,
  },
  statsTitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: theme.colors.onPrimary,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  venueCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  venueType: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  venueStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  venueStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  venueActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  actionText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});