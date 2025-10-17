import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { AdminStackParamList } from '@/navigation/AdminNavigator';

type AuditLogScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'AuditLog'>;

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'user' | 'event' | 'venue' | 'payment' | 'system' | 'admin';
}

interface AuditLogFilter {
  category: string;
  severity: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface AuditLogStats {
  totalEntries: number;
  todayEntries: number;
  criticalIssues: number;
  failedActions: number;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
  topActions: Array<{ action: string; count: number }>;
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.filterChip, active && styles.filterChipActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

interface AuditLogCardProps {
  entry: AuditLogEntry;
  onPress: () => void;
}

const AuditLogCard: React.FC<AuditLogCardProps> = ({ entry, onPress }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return theme.colors.error;
      case 'high': return '#FF9800';
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.success;
      default: return theme.colors.outline;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return theme.colors.success;
      case 'failure': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      default: return theme.colors.outline;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return 'login';
      case 'user': return 'person';
      case 'event': return 'event';
      case 'venue': return 'business';
      case 'payment': return 'payment';
      case 'system': return 'settings';
      case 'admin': return 'admin-panel-settings';
      default: return 'history';
    }
  };

  return (
    <TouchableOpacity style={styles.auditCard} onPress={onPress}>
      <View style={styles.auditHeader}>
        <View style={styles.auditIcon}>
          <Icon name={getCategoryIcon(entry.category)} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.auditContent}>
          <Text style={styles.auditAction}>{entry.action}</Text>
          <Text style={styles.auditResource}>
            {entry.resource} {entry.resourceId && `(${entry.resourceId})`}
          </Text>
        </View>
        <View style={styles.auditStatus}>
          <View style={[styles.severityDot, { backgroundColor: getSeverityColor(entry.severity) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(entry.status) }]}>
            {entry.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.auditDetails} numberOfLines={2}>
        {entry.details}
      </Text>
      
      <View style={styles.auditFooter}>
        <View style={styles.auditUser}>
          <Icon name="person" size={14} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.userText}>{entry.userName}</Text>
        </View>
        <View style={styles.auditMeta}>
          <Text style={styles.auditTime}>
            {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
          </Text>
          <Text style={styles.severityText}>
            {entry.severity.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const AuditLogScreen: React.FC = () => {
  const navigation = useNavigation<AuditLogScreenNavigationProp>();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([
    {
      id: '1',
      timestamp: '2024-01-15T10:30:00Z',
      userId: 'user1',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      action: 'LOGIN',
      resource: 'User',
      resourceId: 'user1',
      details: 'User logged in successfully from mobile app',
      ipAddress: '192.168.1.100',
      userAgent: 'Tazkartak Mobile App 1.0.0',
      status: 'success',
      severity: 'low',
      category: 'auth',
    },
    {
      id: '2',
      timestamp: '2024-01-15T09:15:00Z',
      userId: 'admin1',
      userName: 'Admin User',
      userEmail: 'admin@tazkartak.com',
      action: 'DELETE_EVENT',
      resource: 'Event',
      resourceId: 'event123',
      details: 'Event deleted due to violation of terms of service',
      ipAddress: '10.0.0.50',
      userAgent: 'Tazkartak Admin Panel 1.0.0',
      status: 'success',
      severity: 'high',
      category: 'admin',
    },
    {
      id: '3',
      timestamp: '2024-01-15T08:45:00Z',
      userId: 'user2',
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      action: 'PAYMENT_FAILED',
      resource: 'Payment',
      resourceId: 'payment456',
      details: 'Payment processing failed due to insufficient funds',
      ipAddress: '192.168.1.101',
      userAgent: 'Tazkartak Web App 1.0.0',
      status: 'failure',
      severity: 'medium',
      category: 'payment',
    },
    {
      id: '4',
      timestamp: '2024-01-15T07:20:00Z',
      userId: 'system',
      userName: 'System',
      userEmail: 'system@tazkartak.com',
      action: 'SYSTEM_BACKUP',
      resource: 'System',
      details: 'Automated daily backup completed successfully',
      ipAddress: '127.0.0.1',
      userAgent: 'Tazkartak Backup Service 1.0.0',
      status: 'success',
      severity: 'low',
      category: 'system',
    },
    {
      id: '5',
      timestamp: '2024-01-15T06:10:00Z',
      userId: 'user3',
      userName: 'Bob Johnson',
      userEmail: 'bob@example.com',
      action: 'CREATE_EVENT',
      resource: 'Event',
      resourceId: 'event789',
      details: 'New event created: Tech Conference 2024',
      ipAddress: '192.168.1.102',
      userAgent: 'Tazkartak Web App 1.0.0',
      status: 'success',
      severity: 'low',
      category: 'event',
    },
  ]);

  const [stats] = useState<AuditLogStats>({
    totalEntries: 15420,
    todayEntries: 127,
    criticalIssues: 3,
    failedActions: 15,
    topUsers: [
      { userId: 'admin1', userName: 'Admin User', count: 245 },
      { userId: 'user1', userName: 'John Doe', count: 189 },
      { userId: 'user2', userName: 'Jane Smith', count: 156 },
    ],
    topActions: [
      { action: 'LOGIN', count: 892 },
      { action: 'CREATE_EVENT', count: 234 },
      { action: 'UPDATE_PROFILE', count: 187 },
    ],
  });

  const [filters, setFilters] = useState<AuditLogFilter>({
    category: 'all',
    severity: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  const [activeFilters, setActiveFilters] = useState({
    category: false,
    severity: false,
    status: false,
  });

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      // dispatch(fetchAuditLogs(filters));
      // Mock loading
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      Alert.alert('Error', 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEntries = () => {
    let filtered = auditEntries;

    if (filters.category !== 'all') {
      filtered = filtered.filter(entry => entry.category === filters.category);
    }

    if (filters.severity !== 'all') {
      filtered = filtered.filter(entry => entry.severity === filters.severity);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    if (filters.search) {
      filtered = filtered.filter(entry =>
        entry.action.toLowerCase().includes(filters.search.toLowerCase()) ||
        entry.userName.toLowerCase().includes(filters.search.toLowerCase()) ||
        entry.details.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const handleFilterChange = (key: keyof AuditLogFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      category: 'all',
      severity: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      search: '',
    });
    setActiveFilters({
      category: false,
      severity: false,
      status: false,
    });
  };

  const handleExportLogs = () => {
    Alert.alert(
      'Export Audit Logs',
      'Export audit logs to CSV file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              // dispatch(exportAuditLogs(filters));
              Alert.alert('Success', 'Audit logs exported successfully');
            } catch (error) {
              console.error('Export failed:', error);
              Alert.alert('Error', 'Failed to export audit logs');
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (entry: AuditLogEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filter Audit Logs</Text>
          <TouchableOpacity onPress={() => setShowFilterModal(false)}>
            <Icon name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.filterOptions}>
              {['all', 'auth', 'user', 'event', 'venue', 'payment', 'system', 'admin'].map((category) => (
                <FilterChip
                  key={category}
                  label={category.toUpperCase()}
                  active={filters.category === category}
                  onPress={() => handleFilterChange('category', category)}
                />
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Severity</Text>
            <View style={styles.filterOptions}>
              {['all', 'low', 'medium', 'high', 'critical'].map((severity) => (
                <FilterChip
                  key={severity}
                  label={severity.toUpperCase()}
                  active={filters.severity === severity}
                  onPress={() => handleFilterChange('severity', severity)}
                />
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.filterOptions}>
              {['all', 'success', 'failure', 'warning'].map((status) => (
                <FilterChip
                  key={status}
                  label={status.toUpperCase()}
                  active={filters.status === status}
                  onPress={() => handleFilterChange('status', status)}
                />
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Search</Text>
            <TextInput
              style={styles.textInput}
              value={filters.search}
              onChangeText={(text) => handleFilterChange('search', text)}
              placeholder="Search by action, user, or details"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date From</Text>
            <TextInput
              style={styles.textInput}
              value={filters.dateFrom}
              onChangeText={(text) => handleFilterChange('dateFrom', text)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date To</Text>
            <TextInput
              style={styles.textInput}
              value={filters.dateTo}
              onChangeText={(text) => handleFilterChange('dateTo', text)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
            <Icon name="clear" size={20} color={theme.colors.error} />
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilterModal(false)}>
            <Icon name="check" size={20} color="#fff" />
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderDetailModal = () => {
    if (!selectedEntry) return null;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Audit Log Details</Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Icon name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Action</Text>
              <Text style={styles.detailValue}>{selectedEntry.action}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Resource</Text>
              <Text style={styles.detailValue}>
                {selectedEntry.resource} {selectedEntry.resourceId && `(${selectedEntry.resourceId})`}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Details</Text>
              <Text style={styles.detailValue}>{selectedEntry.details}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>User</Text>
              <Text style={styles.detailValue}>{selectedEntry.userName} ({selectedEntry.userEmail})</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Timestamp</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedEntry.timestamp).toLocaleString()}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>IP Address</Text>
              <Text style={styles.detailValue}>{selectedEntry.ipAddress}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>User Agent</Text>
              <Text style={styles.detailValue}>{selectedEntry.userAgent}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, { 
                color: selectedEntry.status === 'success' ? theme.colors.success : 
                      selectedEntry.status === 'failure' ? theme.colors.error : theme.colors.warning 
              }]}>
                {selectedEntry.status.toUpperCase()}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Severity</Text>
              <Text style={[styles.detailValue, { 
                color: selectedEntry.severity === 'critical' ? theme.colors.error :
                      selectedEntry.severity === 'high' ? '#FF9800' :
                      selectedEntry.severity === 'medium' ? theme.colors.warning : theme.colors.success
              }]}>
                {selectedEntry.severity.toUpperCase()}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{selectedEntry.category.toUpperCase()}</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const filteredEntries = getFilteredEntries();

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Audit Log</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.todayEntries}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.error }]}>{stats.criticalIssues}</Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Icon name="search" size={20} color={theme.colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchTextInput}
            value={filters.search}
            onChangeText={(text) => handleFilterChange('search', text)}
            placeholder="Search audit logs..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Icon name="filter-list" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportLogs}>
          <Icon name="download" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      <View style={styles.activeFiltersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(filters.category !== 'all' || filters.severity !== 'all' || filters.status !== 'all') && (
            <TouchableOpacity style={styles.clearAllButton} onPress={handleClearFilters}>
              <Icon name="clear" size={16} color={theme.colors.error} />
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
          {filters.category !== 'all' && (
            <FilterChip
              label={`Category: ${filters.category.toUpperCase()}`}
              active={true}
              onPress={() => handleFilterChange('category', 'all')}
            />
          )}
          {filters.severity !== 'all' && (
            <FilterChip
              label={`Severity: ${filters.severity.toUpperCase()}`}
              active={true}
              onPress={() => handleFilterChange('severity', 'all')}
            />
          )}
          {filters.status !== 'all' && (
            <FilterChip
              label={`Status: ${filters.status.toUpperCase()}`}
              active={true}
              onPress={() => handleFilterChange('status', 'all')}
            />
          )}
        </ScrollView>
      </View>

      {/* Audit Logs List */}
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AuditLogCard
            entry={item}
            onPress={() => handleViewDetails(item)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {renderFilterModal()}
      {renderDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.onSurface,
    marginLeft: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFiltersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.error + '20',
    marginRight: 8,
  },
  clearAllText: {
    fontSize: 12,
    color: theme.colors.error,
    fontWeight: '600',
    marginLeft: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  auditCard: {
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
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  auditIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  auditContent: {
    flex: 1,
  },
  auditAction: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  auditResource: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  auditStatus: {
    alignItems: 'center',
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  auditDetails: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
    lineHeight: 20,
  },
  auditFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  auditMeta: {
    alignItems: 'flex-end',
  },
  auditTime: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    gap: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surface,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  clearButtonText: {
    fontSize: 16,
    color: theme.colors.error,
    fontWeight: '600',
    marginLeft: 8,
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: theme.colors.onSurface,
    lineHeight: 22,
  },
});
