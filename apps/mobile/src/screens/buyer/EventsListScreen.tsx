import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Searchbar, Chip, FAB, useTheme } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { BuyerStackParamList } from '@/navigation/BuyerNavigator';
import { theme } from '@/config/theme';
import { Event } from '@/types/event.types';
import { eventsService } from '@/services/events.service';

type EventsListScreenNavigationProp = StackNavigationProp<BuyerStackParamList, 'EventsList'>;

export const EventsListScreen: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const navigation = useNavigation<EventsListScreenNavigationProp>();
  const { colors } = useTheme();

  const categories = [
    { id: 'all', label: 'All Events' },
    { id: 'music', label: 'Music' },
    { id: 'sports', label: 'Sports' },
    { id: 'conference', label: 'Conference' },
    { id: 'workshop', label: 'Workshop' },
    { id: 'exhibition', label: 'Exhibition' },
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, selectedCategory]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const response = await eventsService.getEvents({
        status: 'published',
        limit: 50,
      });
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

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event =>
        event.category === selectedCategory
      );
    }

    setFilteredEvents(filtered);
  };

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetails', { eventId: event.id });
  };

  const handleSearchPress = () => {
    navigation.navigate('EventSearch');
  };

  const handleMapPress = () => {
    navigation.navigate('EventMap');
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(price);
  };

  const renderEventCard = useCallback(({ item }: { item: Event }) => (
    <Card
      style={styles.eventCard}
      onPress={() => handleEventPress(item)}
    >
      <Card.Cover
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/300x200' }}
        style={styles.eventImage}
      />
      <Card.Content style={styles.eventContent}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.eventDate}>
          {formatDate(item.startDate)}
        </Text>
        <Text style={styles.eventLocation} numberOfLines={1}>
          {item.venue?.name}
        </Text>
        <Text style={styles.eventPrice}>
          From {formatPrice(item.minPrice || 0)}
        </Text>
      </Card.Content>
    </Card>
  ), []);

  const handleLoadMore = useCallback(() => {
    // Implement pagination logic here
    // This would typically load more events from the API
    console.log('Loading more events...');
  }, []);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Events Found</Text>
      <Text style={styles.emptyMessage}>
        Try adjusting your search or filters
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search events..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onIconPress={handleSearchPress}
          style={styles.searchBar}
        />
        
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Chip
              selected={selectedCategory === item.id}
              onPress={() => setSelectedCategory(item.id)}
              style={styles.categoryChip}
            >
              {item.label}
            </Chip>
          )}
          contentContainerStyle={styles.categoriesContainer}
        />
      </View>

      <FlashList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEventCard}
        estimatedItemSize={200}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={15}
        updateCellsBatchingPeriod={50}
        getItemType={() => 'event'}
      />

      <FAB
        icon="map"
        style={styles.mapFab}
        onPress={handleMapPress}
        label="Map View"
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
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  searchBar: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  categoriesContainer: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  categoryChip: {
    marginRight: theme.spacing.sm,
  },
  eventsList: {
    padding: theme.spacing.md,
  },
  eventCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  eventImage: {
    height: 200,
  },
  eventContent: {
    padding: theme.spacing.md,
  },
  eventTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
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
    marginBottom: theme.spacing.xs,
  },
  eventPrice: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
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
  mapFab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
  },
});
