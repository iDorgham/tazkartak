import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker } from 'react-native-maps';

import { theme } from '@/config/theme';
import { VenueStackParamList } from '@/navigation/VenueNavigator';
import { RootState } from '@/store';
import { Venue } from '@/types/venue.types';

type VenueDetailsScreenNavigationProp = StackNavigationProp<VenueStackParamList, 'VenueDetails'>;
type VenueDetailsScreenRouteProp = RouteProp<VenueStackParamList, 'VenueDetails'>;

const { width } = Dimensions.get('window');

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

interface QuickActionProps {
  title: string;
  icon: string;
  onPress: () => void;
  color: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, icon, onPress, color }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
      <Icon name={icon} size={24} color="#fff" />
    </View>
    <Text style={styles.quickActionText}>{title}</Text>
  </TouchableOpacity>
);

interface UpcomingEventProps {
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    attendees: number;
    status: 'upcoming' | 'live' | 'completed';
  };
  onPress: (eventId: string) => void;
}

const UpcomingEvent: React.FC<UpcomingEventProps> = ({ event, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#2196F3';
      case 'live':
        return '#4CAF50';
      case 'completed':
        return '#9E9E9E';
      default:
        return theme.colors.outline;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => onPress(event.id)}
      activeOpacity={0.7}
    >
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <View style={[styles.eventStatus, { backgroundColor: getStatusColor(event.status) }]}>
          <Text style={styles.eventStatusText}>
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.eventDate}>{formatDate(event.date)} • {event.time}</Text>
      <View style={styles.eventStats}>
        <Icon name="people" size={16} color={theme.colors.onSurfaceVariant} />
        <Text style={styles.eventAttendees}>{event.attendees} attendees</Text>
      </View>
    </TouchableOpacity>
  );
};

export const VenueDetailsScreen: React.FC = () => {
  const navigation = useNavigation<VenueDetailsScreenNavigationProp>();
  const route = useRoute<VenueDetailsScreenRouteProp>();
  const { venueId } = route.params;

  const dispatch = useDispatch();
  const { venues } = useSelector((state: RootState) => state.venues);

  const [loading, setLoading] = useState(false);
  const [venue, setVenue] = useState<Venue | null>(null);

  // Mock data - replace with actual API calls
  const mockVenue: Venue = {
    id: venueId,
    name: 'Cairo Convention Center',
    type: 'conference',
    capacity: 500,
    description: 'A state-of-the-art convention center in the heart of Cairo, perfect for conferences, exhibitions, and corporate events.',
    street: '123 Tahrir Square',
    city: 'Cairo',
    country: 'Egypt',
    latitude: 31.2001,
    longitude: 29.9187,
    amenities: ['parking', 'wifi', 'accessibility', 'catering', 'security'],
    photos: [
      'https://example.com/venue1.jpg',
      'https://example.com/venue2.jpg',
      'https://example.com/venue3.jpg',
    ],
    phone: '+20 2 1234 5678',
    email: 'info@cairo-convention.com',
    operatingHours: 'Mon-Fri: 8AM-10PM, Sat-Sun: 9AM-8PM',
    specialInstructions: 'Please contact us 48 hours before your event for final arrangements.',
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-03-10',
  };

  const [upcomingEvents] = useState([
    {
      id: '1',
      title: 'Tech Conference 2024',
      date: '2024-03-15',
      time: '9:00 AM',
      attendees: 450,
      status: 'upcoming' as const,
    },
    {
      id: '2',
      title: 'Startup Pitch Event',
      date: '2024-03-22',
      time: '2:00 PM',
      attendees: 200,
      status: 'upcoming' as const,
    },
    {
      id: '3',
      title: 'AI Workshop',
      date: '2024-03-28',
      time: '10:00 AM',
      attendees: 150,
      status: 'live' as const,
    },
  ]);

  useEffect(() => {
    loadVenueDetails();
  }, []);

  const loadVenueDetails = async () => {
    try {
      setLoading(true);
      // dispatch(fetchVenueDetails(venueId));
      
      // Mock loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVenue(mockVenue);
    } catch (error) {
      console.error('Failed to load venue details:', error);
      Alert.alert('Error', 'Failed to load venue details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditVenue = () => {
    navigation.navigate('EditVenue', { venueId });
  };

  const handleScanTickets = () => {
    navigation.navigate('QRScanner', { venueId });
  };

  const handleViewTeam = () => {
    navigation.navigate('VenueTeam', { venueId });
  };

  const handleViewAnalytics = () => {
    Alert.alert('Analytics', 'Venue analytics feature coming soon!');
  };

  const handleEventPress = (eventId: string) => {
    navigation.navigate('EventCheckIn', { eventId, venueId });
  };

  const formatAddress = () => {
    if (!venue) return '';
    return `${venue.street}, ${venue.city}, ${venue.country}`;
  };

  const getAmenityIcon = (amenity: string) => {
    const icons: Record<string, string> = {
      parking: 'local-parking',
      wifi: 'wifi',
      accessibility: 'accessible',
      catering: 'restaurant',
      security: 'security',
      sound: 'volume-up',
      lighting: 'lightbulb',
      ac: 'ac-unit',
    };
    return icons[amenity] || 'check';
  };

  const getAmenityLabel = (amenity: string) => {
    const labels: Record<string, string> = {
      parking: 'Parking',
      wifi: 'WiFi',
      accessibility: 'Accessibility',
      catering: 'Catering',
      security: 'Security',
      sound: 'Sound System',
      lighting: 'Lighting',
      ac: 'Air Conditioning',
    };
    return labels[amenity] || amenity;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading venue details...</Text>
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color={theme.colors.error} />
        <Text style={styles.errorTitle}>Venue Not Found</Text>
        <Text style={styles.errorText}>
          The requested venue could not be found.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Venue Header */}
      <View style={styles.header}>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueType}>{venue.type.charAt(0).toUpperCase() + venue.type.slice(1)}</Text>
          <Text style={styles.venueAddress}>{formatAddress()}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={handleEditVenue}>
          <Icon name="edit" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Venue Photos */}
      {venue.photos && venue.photos.length > 0 && (
        <View style={styles.photosSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {venue.photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={styles.venuePhoto}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatsCard
          title="Capacity"
          value={venue.capacity.toLocaleString()}
          icon="people"
          color={theme.colors.primary}
        />
        <StatsCard
          title="Upcoming Events"
          value={upcomingEvents.length}
          icon="event"
          color="#4CAF50"
        />
        <StatsCard
          title="Total Check-ins"
          value="2,847"
          icon="check-circle"
          color="#FF9800"
        />
        <StatsCard
          title="Team Members"
          value="5"
          icon="group"
          color="#9C27B0"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickAction
            title="Scan Tickets"
            icon="qr-code-scanner"
            onPress={handleScanTickets}
            color={theme.colors.primary}
          />
          <QuickAction
            title="View Team"
            icon="group"
            onPress={handleViewTeam}
            color="#4CAF50"
          />
          <QuickAction
            title="Analytics"
            icon="analytics"
            onPress={handleViewAnalytics}
            color="#FF9800"
          />
        </View>
      </View>

      {/* Venue Description */}
      {venue.description && (
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>About This Venue</Text>
          <Text style={styles.description}>{venue.description}</Text>
        </View>
      )}

      {/* Amenities */}
      <View style={styles.amenitiesSection}>
        <Text style={styles.sectionTitle}>Amenities & Features</Text>
        <View style={styles.amenitiesGrid}>
          {venue.amenities?.map((amenity, index) => (
            <View key={index} style={styles.amenityItem}>
              <Icon
                name={getAmenityIcon(amenity)}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.amenityText}>{getAmenityLabel(amenity)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Location Map */}
      <View style={styles.mapSection}>
        <Text style={styles.sectionTitle}>Location</Text>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: venue.latitude || 31.2001,
            longitude: venue.longitude || 29.9187,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: venue.latitude || 31.2001,
              longitude: venue.longitude || 29.9187,
            }}
            title={venue.name}
            description={formatAddress()}
          />
        </MapView>
      </View>

      {/* Contact Information */}
      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.contactInfo}>
          {venue.phone && (
            <View style={styles.contactItem}>
              <Icon name="phone" size={20} color={theme.colors.primary} />
              <Text style={styles.contactText}>{venue.phone}</Text>
            </View>
          )}
          {venue.email && (
            <View style={styles.contactItem}>
              <Icon name="email" size={20} color={theme.colors.primary} />
              <Text style={styles.contactText}>{venue.email}</Text>
            </View>
          )}
          {venue.operatingHours && (
            <View style={styles.contactItem}>
              <Icon name="schedule" size={20} color={theme.colors.primary} />
              <Text style={styles.contactText}>{venue.operatingHours}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Upcoming Events */}
      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {upcomingEvents.length > 0 ? (
          <View style={styles.eventsList}>
            {upcomingEvents.map((event) => (
              <UpcomingEvent
                key={event.id}
                event={event}
                onPress={handleEventPress}
              />
            ))}
          </View>
        ) : (
          <View style={styles.noEvents}>
            <Icon name="event" size={48} color={theme.colors.outline} />
            <Text style={styles.noEventsText}>No upcoming events</Text>
            <Text style={styles.noEventsSubtext}>
              Create your first event to get started
            </Text>
          </View>
        )}
      </View>

      {/* Special Instructions */}
      {venue.specialInstructions && (
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <Text style={styles.instructions}>{venue.specialInstructions}</Text>
        </View>
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: theme.colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  venueType: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
  },
  photosSection: {
    height: 200,
  },
  venuePhoto: {
    width: width * 0.8,
    height: 200,
    marginRight: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 8,
  },
  statsTitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  quickActionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: theme.colors.onSurface,
    fontWeight: '500',
    textAlign: 'center',
  },
  descriptionSection: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: theme.colors.onSurface,
    lineHeight: 24,
  },
  amenitiesSection: {
    padding: 20,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    elevation: 1,
  },
  amenityText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginLeft: 8,
    fontWeight: '500',
  },
  mapSection: {
    padding: 20,
  },
  map: {
    height: 200,
    borderRadius: 12,
  },
  contactSection: {
    padding: 20,
  },
  contactInfo: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginLeft: 12,
  },
  eventsSection: {
    padding: 20,
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    flex: 1,
  },
  eventStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventStatusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  eventDate: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  eventStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventAttendees: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  noEvents: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noEventsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  noEventsSubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  instructionsSection: {
    padding: 20,
  },
  instructions: {
    fontSize: 16,
    color: theme.colors.onSurface,
    lineHeight: 24,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
  },
});