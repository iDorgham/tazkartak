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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { AdminStackParamList } from '@/navigation/AdminNavigator';
import { RootState } from '@/store';

type VerificationQueueScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'VerificationQueue'>;

interface VerificationItem {
  id: string;
  type: 'user' | 'venue' | 'event' | 'document';
  title: string;
  description: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  documents?: string[];
  metadata?: Record<string, any>;
}

interface VerificationItemProps {
  item: VerificationItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetails: (item: VerificationItem) => void;
}

const VerificationItem: React.FC<VerificationItemProps> = ({
  item,
  onApprove,
  onReject,
  onViewDetails,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user':
        return 'person';
      case 'venue':
        return 'business';
      case 'event':
        return 'event';
      case 'document':
        return 'description';
      default:
        return 'help';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user':
        return '#4CAF50';
      case 'venue':
        return '#2196F3';
      case 'event':
        return '#9C27B0';
      case 'document':
        return '#FF9800';
      default:
        return theme.colors.primary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#FF5722';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return theme.colors.outline;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={styles.verificationItem}
      onPress={() => onViewDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.verificationHeader}>
        <View style={styles.verificationType}>
          <View style={[styles.typeIcon, { backgroundColor: getTypeColor(item.type) }]}>
            <Icon name={getTypeIcon(item.type)} size={20} color="#fff" />
          </View>
          <View style={styles.typeInfo}>
            <Text style={styles.verificationTitle}>{item.title}</Text>
            <Text style={styles.verificationDescription}>{item.description}</Text>
          </View>
        </View>
        <View style={styles.verificationMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </Text>
          </View>
          <Text style={styles.submittedTime}>{formatDate(item.submittedAt)}</Text>
        </View>
      </View>

      <View style={styles.verificationDetails}>
        <Text style={styles.submittedBy}>Submitted by: {item.submittedBy}</Text>
        {item.documents && item.documents.length > 0 && (
          <View style={styles.documentsPreview}>
            <Icon name="attachment" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.documentsText}>
              {item.documents.length} document{item.documents.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.verificationActions}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => onReject(item.id)}
        >
          <Icon name="close" size={16} color="#FF5722" />
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => onApprove(item.id)}
        >
          <Icon name="check" size={16} color="#4CAF50" />
          <Text style={styles.approveButtonText}>Approve</Text>
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

export const VerificationQueueScreen: React.FC = () => {
  const navigation = useNavigation<VerificationQueueScreenNavigationProp>();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'user' | 'venue' | 'event' | 'document'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Mock data - replace with actual API calls
  const [verifications] = useState<VerificationItem[]>([
    {
      id: '1',
      type: 'venue',
      title: 'Cairo Convention Center',
      description: 'Venue verification request with business license and photos',
      submittedBy: 'Ahmed Hassan',
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      priority: 'high',
      documents: ['business_license.pdf', 'venue_photos.zip'],
      metadata: {
        capacity: 500,
        location: 'Cairo, Egypt',
        contact: '+20 123 456 7890',
      },
    },
    {
      id: '2',
      type: 'user',
      title: 'Organizer Account Verification',
      description: 'Identity verification for organizer account upgrade',
      submittedBy: 'Sarah Mohamed',
      submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      priority: 'medium',
      documents: ['id_card.jpg', 'business_certificate.pdf'],
      metadata: {
        userId: 'usr_123456',
        currentRole: 'buyer',
        requestedRole: 'organizer',
      },
    },
    {
      id: '3',
      type: 'event',
      title: 'Tech Conference 2024',
      description: 'Event approval request for large conference',
      submittedBy: 'Omar Ali',
      submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      priority: 'medium',
      documents: ['event_proposal.pdf', 'venue_agreement.pdf'],
      metadata: {
        expectedAttendees: 1000,
        eventDate: '2024-06-15',
        venue: 'Cairo Convention Center',
      },
    },
    {
      id: '4',
      type: 'document',
      title: 'Business License Verification',
      description: 'Business license document verification',
      submittedBy: 'Fatma Ibrahim',
      submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      priority: 'low',
      documents: ['business_license.pdf'],
      metadata: {
        documentType: 'business_license',
        expiryDate: '2025-12-31',
      },
    },
  ]);

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      // dispatch(fetchVerificationQueue());
      // Mock loading
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to load verifications:', error);
      Alert.alert('Error', 'Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadVerifications();
    } catch (error) {
      console.error('Failed to refresh verifications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      // dispatch(approveVerification(id));
      Alert.alert('Success', 'Verification approved successfully');
      await loadVerifications();
    } catch (error) {
      console.error('Failed to approve verification:', error);
      Alert.alert('Error', 'Failed to approve verification');
    }
  };

  const handleReject = async (id: string) => {
    Alert.alert(
      'Reject Verification',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              // dispatch(rejectVerification({ id, reason: 'Manual rejection' }));
              Alert.alert('Success', 'Verification rejected');
              await loadVerifications();
            } catch (error) {
              console.error('Failed to reject verification:', error);
              Alert.alert('Error', 'Failed to reject verification');
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (item: VerificationItem) => {
    Alert.alert(
      'Verification Details',
      `Type: ${item.type}\nTitle: ${item.title}\nDescription: ${item.description}\nSubmitted by: ${item.submittedBy}\nPriority: ${item.priority}`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => handleApprove(item.id),
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => handleReject(item.id),
        },
      ]
    );
  };

  const handleBulkApprove = () => {
    Alert.alert(
      'Bulk Approve',
      'Approve all selected verifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: async () => {
            try {
              // dispatch(bulkApproveVerifications(selectedItems));
              Alert.alert('Success', 'All verifications approved');
              await loadVerifications();
            } catch (error) {
              console.error('Failed to bulk approve:', error);
              Alert.alert('Error', 'Failed to approve verifications');
            }
          },
        },
      ]
    );
  };

  const getFilteredVerifications = (): VerificationItem[] => {
    let filtered = verifications.filter(item => item.status === 'pending');

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.submittedBy.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    return filtered;
  };

  const getStats = () => {
    const totalPending = verifications.filter(item => item.status === 'pending').length;
    const highPriority = verifications.filter(item => item.status === 'pending' && item.priority === 'high').length;
    const overdue = verifications.filter(item => {
      const submittedAt = new Date(item.submittedAt);
      const now = new Date();
      const hoursSinceSubmission = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
      return item.status === 'pending' && hoursSinceSubmission > 24;
    }).length;
    const totalProcessed = verifications.filter(item => item.status !== 'pending').length;

    return { totalPending, highPriority, overdue, totalProcessed };
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="verified-user" size={64} color={theme.colors.outline} />
      <Text style={styles.emptyTitle}>No Pending Verifications</Text>
      <Text style={styles.emptySubtitle}>
        All verification requests have been processed
      </Text>
    </View>
  );

  const stats = getStats();
  const filteredVerifications = getFilteredVerifications();

  return (
    <View style={styles.container}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatsCard
          title="Pending"
          value={stats.totalPending}
          icon="hourglass-empty"
          color="#FF9800"
        />
        <StatsCard
          title="High Priority"
          value={stats.highPriority}
          icon="priority-high"
          color="#FF5722"
        />
        <StatsCard
          title="Overdue"
          value={stats.overdue}
          icon="warning"
          color="#F44336"
        />
        <StatsCard
          title="Processed"
          value={stats.totalProcessed}
          icon="check-circle"
          color="#4CAF50"
        />
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={theme.colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search verifications..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>

        <TouchableOpacity
          style={styles.bulkActionButton}
          onPress={handleBulkApprove}
        >
          <Icon name="checklist" size={16} color={theme.colors.primary} />
          <Text style={styles.bulkActionText}>Bulk Actions</Text>
        </TouchableOpacity>
      </View>

      {/* Type Filter */}
      <View style={styles.typeFilter}>
        {(['all', 'user', 'venue', 'event', 'document'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              typeFilter === type && styles.typeButtonActive,
            ]}
            onPress={() => setTypeFilter(type)}
          >
            <Text
              style={[
                styles.typeButtonText,
                typeFilter === type && styles.typeButtonTextActive,
              ]}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Priority Filter */}
      <View style={styles.priorityFilter}>
        {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
          <TouchableOpacity
            key={priority}
            style={[
              styles.priorityButton,
              priorityFilter === priority && styles.priorityButtonActive,
            ]}
            onPress={() => setPriorityFilter(priority)}
          >
            <Text
              style={[
                styles.priorityButtonText,
                priorityFilter === priority && styles.priorityButtonTextActive,
              ]}
            >
              {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Verifications List */}
      <FlatList
        data={filteredVerifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VerificationItem
            item={item}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewDetails={handleViewDetails}
          />
        )}
        contentContainerStyle={[
          styles.listContainer,
          filteredVerifications.length === 0 && styles.emptyListContainer,
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  filtersContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.onSurface,
    marginLeft: 8,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  bulkActionText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  typeFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
  },
  typeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  typeButtonText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: theme.colors.onPrimary,
  },
  priorityFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  priorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
  },
  priorityButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  priorityButtonText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  priorityButtonTextActive: {
    color: theme.colors.onPrimary,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  verificationItem: {
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
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  verificationType: {
    flexDirection: 'row',
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  verificationDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  verificationMeta: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  submittedTime: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  verificationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  submittedBy: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  documentsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentsText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  verificationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF5722',
    backgroundColor: 'transparent',
  },
  rejectButtonText: {
    fontSize: 14,
    color: '#FF5722',
    marginLeft: 4,
    fontWeight: '500',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  approveButtonText: {
    fontSize: 14,
    color: '#fff',
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
  },
});
