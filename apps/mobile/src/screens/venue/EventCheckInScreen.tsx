import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { VenueStackParamList } from '@/navigation/VenueNavigator';
import { RootState } from '@/store';

type EventCheckInScreenNavigationProp = StackNavigationProp<VenueStackParamList, 'EventCheckIn'>;
type EventCheckInScreenRouteProp = RouteProp<VenueStackParamList, 'EventCheckIn'>;

interface CheckInStats {
  totalAttendees: number;
  checkedIn: number;
  notCheckedIn: number;
  checkInRate: number;
}

interface RecentCheckIn {
  id: string;
  attendeeName: string;
  ticketType: string;
  checkedInAt: string;
  scannedBy: string;
}

interface Attendee {
  id: string;
  name: string;
  email: string;
  ticketType: string;
  status: 'checked-in' | 'not-checked-in';
  checkedInAt?: string;
  scannedBy?: string;
}

interface CheckInStatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}

const CheckInStatsCard: React.FC<CheckInStatsCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
}) => (
  <View style={styles.statsCard}>
    <Icon name={icon} size={24} color={color} />
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsTitle}>{title}</Text>
    {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
  </View>
);

interface RecentCheckInItemProps {
  checkIn: RecentCheckIn;
}

const RecentCheckInItem: React.FC<RecentCheckInItemProps> = ({ checkIn }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  return (
    <View style={styles.recentCheckInItem}>
      <View style={styles.checkInIcon}>
        <Icon name="check-circle" size={20} color="#4CAF50" />
      </View>
      <View style={styles.checkInInfo}>
        <Text style={styles.attendeeName}>{checkIn.attendeeName}</Text>
        <Text style={styles.ticketType}>{checkIn.ticketType}</Text>
      </View>
      <View style={styles.checkInTime}>
        <Text style={styles.timeText}>{formatTime(checkIn.checkedInAt)}</Text>
        <Text style={styles.scannerText}>by {checkIn.scannedBy}</Text>
      </View>
    </View>
  );
};

interface AttendeeItemProps {
  attendee: Attendee;
  onManualCheckIn: (attendeeId: string) => void;
}

const AttendeeItem: React.FC<AttendeeItemProps> = ({ attendee, onManualCheckIn }) => {
  const getStatusColor = (status: string) => {
    return status === 'checked-in' ? '#4CAF50' : '#FF5722';
  };

  const getStatusIcon = (status: string) => {
    return status === 'checked-in' ? 'check-circle' : 'radio-button-unchecked';
  };

  return (
    <View style={styles.attendeeItem}>
      <View style={styles.attendeeInfo}>
        <Text style={styles.attendeeName}>{attendee.name}</Text>
        <Text style={styles.attendeeEmail}>{attendee.email}</Text>
        <Text style={styles.ticketType}>{attendee.ticketType}</Text>
        {attendee.status === 'checked-in' && attendee.checkedInAt && (
          <Text style={styles.checkInTime}>
            Checked in: {new Date(attendee.checkedInAt).toLocaleString()}
          </Text>
        )}
      </View>
      <View style={styles.attendeeActions}>
        <Icon
          name={getStatusIcon(attendee.status)}
          size={24}
          color={getStatusColor(attendee.status)}
        />
        {attendee.status === 'not-checked-in' && (
          <TouchableOpacity
            style={styles.manualCheckInButton}
            onPress={() => onManualCheckIn(attendee.id)}
          >
            <Icon name="person-add" size={16} color={theme.colors.primary} />
            <Text style={styles.manualCheckInText}>Check In</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
);

export const EventCheckInScreen: React.FC = () => {
  const navigation = useNavigation<EventCheckInScreenNavigationProp>();
  const route = useRoute<EventCheckInScreenRouteProp>();
  const { eventId, venueId } = route.params;

  const dispatch = useDispatch();
  const { events } = useSelector((state: RootState) => state.events);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked-in' | 'not-checked-in'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'attendees'>('overview');

  // Mock data - replace with actual API calls
  const [checkInStats, setCheckInStats] = useState<CheckInStats>({
    totalAttendees: 150,
    checkedIn: 89,
    notCheckedIn: 61,
    checkInRate: 59.3,
  });

  const [recentCheckIns] = useState<RecentCheckIn[]>([
    {
      id: '1',
      attendeeName: 'Ahmed Hassan',
      ticketType: 'VIP',
      checkedInAt: new Date().toISOString(),
      scannedBy: 'John Doe',
    },
    {
      id: '2',
      attendeeName: 'Sarah Mohamed',
      ticketType: 'General',
      checkedInAt: new Date(Date.now() - 300000).toISOString(),
      scannedBy: 'Jane Smith',
    },
    {
      id: '3',
      attendeeName: 'Omar Ali',
      ticketType: 'Student',
      checkedInAt: new Date(Date.now() - 600000).toISOString(),
      scannedBy: 'John Doe',
    },
  ]);

  const [attendees] = useState<Attendee[]>([
    {
      id: '1',
      name: 'Ahmed Hassan',
      email: 'ahmed@example.com',
      ticketType: 'VIP',
      status: 'checked-in',
      checkedInAt: new Date().toISOString(),
      scannedBy: 'John Doe',
    },
    {
      id: '2',
      name: 'Sarah Mohamed',
      email: 'sarah@example.com',
      ticketType: 'General',
      status: 'checked-in',
      checkedInAt: new Date(Date.now() - 300000).toISOString(),
      scannedBy: 'Jane Smith',
    },
    {
      id: '3',
      name: 'Omar Ali',
      email: 'omar@example.com',
      ticketType: 'Student',
      status: 'not-checked-in',
    },
    {
      id: '4',
      name: 'Fatma Ibrahim',
      email: 'fatma@example.com',
      ticketType: 'General',
      status: 'not-checked-in',
    },
  ]);

  useEffect(() => {
    loadEventData();
  }, []);

  const loadEventData = async () => {
    try {
      setLoading(true);
      // dispatch(fetchEventCheckIns(eventId));
      // Mock loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to load event data:', error);
      Alert.alert('Error', 'Failed to load event check-in data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadEventData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickScan = () => {
    navigation.navigate('QRScanner', { eventId, venueId });
  };

  const handleManualCheckIn = async (attendeeId: string) => {
    try {
      Alert.alert(
        'Manual Check-In',
        'Are you sure you want to manually check in this attendee?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Check In',
            onPress: async () => {
              // dispatch(manualCheckIn({ attendeeId, eventId }));
              Alert.alert('Success', 'Attendee checked in successfully');
              await handleRefresh();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to check in attendee:', error);
      Alert.alert('Error', 'Failed to check in attendee');
    }
  };

  const handleExportAttendees = () => {
    Alert.alert(
      'Export Attendees',
      'Export attendee list as CSV?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            // Implement export functionality
            Alert.alert('Export', 'Attendee list exported successfully');
          },
        },
      ]
    );
  };

  const getFilteredAttendees = (): Attendee[] => {
    let filtered = attendees;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(attendee =>
        attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendee.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(attendee => attendee.status === statusFilter);
    }

    return filtered;
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <CheckInStatsCard
          title="Total Attendees"
          value={checkInStats.totalAttendees}
          icon="people"
          color={theme.colors.primary}
        />
        <CheckInStatsCard
          title="Checked In"
          value={checkInStats.checkedIn}
          icon="check-circle"
          color="#4CAF50"
        />
        <CheckInStatsCard
          title="Not Checked In"
          value={checkInStats.notCheckedIn}
          icon="radio-button-unchecked"
          color="#FF5722"
        />
        <CheckInStatsCard
          title="Check-In Rate"
          value={`${checkInStats.checkInRate}%`}
          icon="trending-up"
          color="#FF9800"
          subtitle="Attendance rate"
        />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Check-In Progress</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${checkInStats.checkInRate}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {checkInStats.checkedIn} of {checkInStats.totalAttendees} attendees checked in
        </Text>
      </View>

      {/* Recent Check-Ins */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Check-Ins</Text>
          <TouchableOpacity onPress={() => setActiveTab('attendees')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={recentCheckIns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RecentCheckInItem checkIn={item} />}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.scanButton} onPress={handleQuickScan}>
          <Icon name="qr-code-scanner" size={24} color="#fff" />
          <Text style={styles.scanButtonText}>Quick Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportAttendees}>
          <Icon name="file-download" size={20} color={theme.colors.primary} />
          <Text style={styles.exportButtonText}>Export List</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAttendees = () => {
    const filteredAttendees = getFilteredAttendees();

    return (
      <View style={styles.tabContent}>
        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color={theme.colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search attendees..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>
        </View>

        {/* Status Filter */}
        <View style={styles.statusFilter}>
          {(['all', 'checked-in', 'not-checked-in'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusButton,
                statusFilter === status && styles.statusButtonActive,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  statusFilter === status && styles.statusButtonTextActive,
                ]}
              >
                {status === 'checked-in' ? 'Checked In' : 
                 status === 'not-checked-in' ? 'Not Checked In' : 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Attendees List */}
        <FlatList
          data={filteredAttendees}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AttendeeItem
              attendee={item}
              onManualCheckIn={handleManualCheckIn}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Event Header */}
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>Tech Conference 2024</Text>
        <Text style={styles.eventDate}>March 15, 2024 • 9:00 AM</Text>
        <Text style={styles.venueName}>Cairo Convention Center</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'overview' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'overview' && styles.tabButtonTextActive,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'attendees' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('attendees')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'attendees' && styles.tabButtonTextActive,
            ]}
          >
            Attendees ({attendees.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' ? renderOverview() : renderAttendees()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  eventHeader: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  venueName: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    elevation: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 8,
  },
  statsTitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  statsSubtitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'center',
  },
  progressContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center',
  },
  recentSection: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  recentCheckInItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  checkInIcon: {
    marginRight: 12,
  },
  checkInInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  ticketType: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  checkInTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  scannerText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    paddingVertical: 16,
    borderRadius: 12,
  },
  exportButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.onSurface,
    marginLeft: 8,
  },
  statusFilter: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
  },
  statusButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  statusButtonText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: theme.colors.onPrimary,
  },
  attendeeItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeEmail: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  attendeeActions: {
    alignItems: 'center',
  },
  manualCheckInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
  },
  manualCheckInText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
});