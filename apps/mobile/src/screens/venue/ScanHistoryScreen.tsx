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
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { VenueStackParamList } from '@/navigation/VenueNavigator';
import { QRScanResult } from '@/types/qr.types';
import { RootState } from '@/store';
import { OfflineQRService } from '@/services/offline-qr.service';

type ScanHistoryScreenNavigationProp = StackNavigationProp<VenueStackParamList, 'ScanHistory'>;
type ScanHistoryScreenRouteProp = RouteProp<VenueStackParamList, 'ScanHistory'>;

interface ScanHistoryItemProps {
  scan: QRScanResult;
  onPress: (scan: QRScanResult) => void;
}

const ScanHistoryItem: React.FC<ScanHistoryItemProps> = ({ scan, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#4CAF50';
      case 'failed':
        return '#FF5722';
      case 'duplicate':
        return '#FF9800';
      default:
        return theme.colors.outline;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return 'check-circle';
      case 'failed':
        return 'error';
      case 'duplicate':
        return 'warning';
      default:
        return 'help';
    }
  };

  return (
    <TouchableOpacity
      style={styles.scanItem}
      onPress={() => onPress(scan)}
      activeOpacity={0.7}
    >
      <View style={styles.scanHeader}>
        <View style={styles.scanInfo}>
          <Text style={styles.ticketHolder}>{scan.ticketHolder}</Text>
          <Text style={styles.scanTime}>{formatDate(scan.scannedAt)}</Text>
          <Text style={styles.ticketId}>Ticket: {scan.ticketId}</Text>
        </View>
        <View style={styles.scanStatus}>
          <Icon
            name={getStatusIcon(scan.status)}
            size={24}
            color={getStatusColor(scan.status)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(scan.status) }]}>
            {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.scanDetails}>
        <View style={styles.detailRow}>
          <Icon name="event" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.detailText}>Event: {scan.eventId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="person" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.detailText}>Scanned by: {scan.scannedBy}</Text>
        </View>
        {scan.offline && (
          <View style={styles.detailRow}>
            <Icon name="cloud-off" size={16} color="#FF9800" />
            <Text style={[styles.detailText, { color: '#FF9800' }]}>Scanned offline</Text>
          </View>
        )}
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

export const ScanHistoryScreen: React.FC = () => {
  const navigation = useNavigation<ScanHistoryScreenNavigationProp>();
  const route = useRoute<ScanHistoryScreenRouteProp>();
  const { venueId, eventId } = route.params;

  const dispatch = useDispatch();
  const { scanHistory, loading } = useSelector((state: RootState) => state.qr);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'duplicate'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadScanHistory();
  }, []);

  const loadScanHistory = async () => {
    try {
      // dispatch(fetchScanHistory({ venueId, eventId }));
      // Also load offline queued scans
      const queuedScans = await OfflineQRService.getQueuedScans();
      console.log('Queued scans:', queuedScans);
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadScanHistory();
    } catch (error) {
      console.error('Failed to refresh scan history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleScanPress = (scan: QRScanResult) => {
    // Show scan details modal or navigate to details screen
    Alert.alert(
      'Scan Details',
      `Ticket Holder: ${scan.ticketHolder}\n` +
      `Event ID: ${scan.eventId}\n` +
      `Scanned At: ${new Date(scan.scannedAt).toLocaleString()}\n` +
      `Status: ${scan.status}\n` +
      `Scanned By: ${scan.scannedBy}`,
      [{ text: 'OK' }]
    );
  };

  const handleExportHistory = async () => {
    try {
      const filteredScans = getFilteredScans();
      
      // Convert to CSV format
      const csvHeader = 'Date,Time,Ticket ID,Ticket Holder,Event ID,Status,Scanned By,Offline\n';
      const csvRows = filteredScans.map(scan => {
        const date = new Date(scan.scannedAt);
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          scan.ticketId,
          scan.ticketHolder,
          scan.eventId,
          scan.status,
          scan.scannedBy,
          scan.offline ? 'Yes' : 'No'
        ].join(',');
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      // Share the CSV content
      await Share.share({
        message: csvContent,
        title: 'Scan History Export',
      });
    } catch (error) {
      console.error('Failed to export scan history:', error);
      Alert.alert('Export Failed', 'Failed to export scan history');
    }
  };

  const getFilteredScans = (): QRScanResult[] => {
    let filtered = scanHistory || [];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(scan =>
        scan.ticketHolder.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scan.ticketId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(scan => scan.status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(scan => new Date(scan.scannedAt) >= filterDate);
    }

    return filtered.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  };

  const getStats = () => {
    const scans = getFilteredScans();
    const totalScans = scans.length;
    const successfulScans = scans.filter(scan => scan.status === 'success').length;
    const failedScans = scans.filter(scan => scan.status === 'failed').length;
    const offlineScans = scans.filter(scan => scan.offline).length;

    return { totalScans, successfulScans, failedScans, offlineScans };
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="history" size={64} color={theme.colors.outline} />
      <Text style={styles.emptyTitle}>No Scan History</Text>
      <Text style={styles.emptySubtitle}>
        Scan some tickets to see the history here
      </Text>
    </View>
  );

  const stats = getStats();
  const filteredScans = getFilteredScans();

  return (
    <View style={styles.container}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatsCard
          title="Total Scans"
          value={stats.totalScans}
          icon="qr-code-scanner"
          color={theme.colors.primary}
        />
        <StatsCard
          title="Successful"
          value={stats.successfulScans}
          icon="check-circle"
          color="#4CAF50"
        />
        <StatsCard
          title="Failed"
          value={stats.failedScans}
          icon="error"
          color="#FF5722"
        />
        <StatsCard
          title="Offline"
          value={stats.offlineScans}
          icon="cloud-off"
          color="#FF9800"
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
            placeholder="Search by ticket holder or ID..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>

        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportHistory}
          >
            <Icon name="file-download" size={16} color={theme.colors.primary} />
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.statusFilter}>
        {(['all', 'success', 'failed', 'duplicate'] as const).map((status) => (
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
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Filter */}
      <View style={styles.dateFilter}>
        {(['all', 'today', 'week', 'month'] as const).map((date) => (
          <TouchableOpacity
            key={date}
            style={[
              styles.dateButton,
              dateFilter === date && styles.dateButtonActive,
            ]}
            onPress={() => setDateFilter(date)}
          >
            <Text
              style={[
                styles.dateButtonText,
                dateFilter === date && styles.dateButtonTextActive,
              ]}
            >
              {date.charAt(0).toUpperCase() + date.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scan History List */}
      <FlatList
        data={filteredScans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ScanHistoryItem scan={item} onPress={handleScanPress} />
        )}
        contentContainerStyle={[
          styles.listContainer,
          filteredScans.length === 0 && styles.emptyListContainer,
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
  filterButtons: {
    flexDirection: 'row',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  exportText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  statusFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
  },
  statusButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  statusButtonText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: theme.colors.onPrimary,
  },
  dateFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
  },
  dateButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  dateButtonText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  dateButtonTextActive: {
    color: theme.colors.onPrimary,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  scanItem: {
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
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scanInfo: {
    flex: 1,
  },
  ticketHolder: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  scanTime: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  ticketId: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  scanStatus: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  scanDetails: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 8,
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