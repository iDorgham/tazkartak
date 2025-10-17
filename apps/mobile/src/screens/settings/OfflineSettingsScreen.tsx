import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { RootState } from '@/store';
import {
  fetchOfflineStats,
  updateSyncConfig,
  clearCache,
  preloadData,
  enableSync,
  disableSync,
} from '@/store/offline.slice';

export const OfflineSettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const {
    isOnline,
    syncInProgress,
    pendingSyncCount,
    syncStats,
    cacheStats,
    syncConfig,
    failedSyncs,
    conflicts,
  } = useSelector((state: RootState) => state.offline);

  const [localConfig, setLocalConfig] = useState(syncConfig);

  useEffect(() => {
    dispatch(fetchOfflineStats());
  }, [dispatch]);

  useEffect(() => {
    setLocalConfig(syncConfig);
  }, [syncConfig]);

  const handleSyncToggle = (value: boolean) => {
    if (value) {
      dispatch(enableSync());
    } else {
      dispatch(disableSync());
    }
  };

  const handleConfigChange = (key: keyof typeof syncConfig, value: any) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    dispatch(updateSyncConfig(newConfig));
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all offline data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => dispatch(clearCache()),
        },
      ]
    );
  };

  const handlePreloadData = () => {
    Alert.alert(
      'Preload Data',
      'Choose which data to download for offline use',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Events Only',
          onPress: () => dispatch(preloadData({ type: 'events' })),
        },
        {
          text: 'All Data',
          onPress: () => {
            dispatch(preloadData({ type: 'events' }));
            dispatch(preloadData({ type: 'venues' }));
            dispatch(preloadData({ type: 'tickets' }));
          },
        },
      ]
    );
  };

  const handleSyncNow = () => {
    if (syncInProgress) {
      Alert.alert('Sync in Progress', 'Please wait for the current sync to complete.');
      return;
    }

    Alert.alert(
      'Sync Now',
      'This will sync all pending changes. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sync', onPress: () => dispatch(performSync()) },
      ]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number): string => {
    if (timestamp === 0) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Connection Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Status</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Icon
              name={isOnline ? 'wifi' : 'wifi-off'}
              size={24}
              color={isOnline ? theme.colors.success : theme.colors.error}
            />
            <Text style={styles.statusText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          
          {pendingSyncCount > 0 && (
            <View style={styles.pendingSync}>
              <Icon name="sync" size={16} color={theme.colors.warning} />
              <Text style={styles.pendingText}>
                {pendingSyncCount} items pending sync
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Sync Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Auto Sync</Text>
            <Text style={styles.settingDescription}>
              Automatically sync data when online
            </Text>
          </View>
          <Switch
            value={localConfig.enabled}
            onValueChange={handleSyncToggle}
            trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
            thumbColor={localConfig.enabled ? '#fff' : theme.colors.onSurfaceVariant}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Sync Interval</Text>
            <Text style={styles.settingDescription}>
              How often to check for sync (minutes)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.valueButton}
            onPress={() => {
              Alert.alert(
                'Sync Interval',
                'Choose sync interval',
                [
                  { text: '1 min', onPress: () => handleConfigChange('interval', 60000) },
                  { text: '5 min', onPress: () => handleConfigChange('interval', 300000) },
                  { text: '15 min', onPress: () => handleConfigChange('interval', 900000) },
                  { text: '30 min', onPress: () => handleConfigChange('interval', 1800000) },
                ]
              );
            }}
          >
            <Text style={styles.valueText}>
              {Math.round(localConfig.interval / 60000)} min
            </Text>
            <Icon name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Batch Size</Text>
            <Text style={styles.settingDescription}>
              Number of items to sync at once
            </Text>
          </View>
          <TouchableOpacity
            style={styles.valueButton}
            onPress={() => {
              Alert.alert(
                'Batch Size',
                'Choose batch size',
                [
                  { text: '5', onPress: () => handleConfigChange('batchSize', 5) },
                  { text: '10', onPress: () => handleConfigChange('batchSize', 10) },
                  { text: '20', onPress: () => handleConfigChange('batchSize', 20) },
                  { text: '50', onPress: () => handleConfigChange('batchSize', 50) },
                ]
              );
            }}
          >
            <Text style={styles.valueText}>{localConfig.batchSize}</Text>
            <Icon name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Sync on App Open</Text>
            <Text style={styles.settingDescription}>
              Sync when app becomes active
            </Text>
          </View>
          <Switch
            value={localConfig.syncOnAppStateChange}
            onValueChange={(value) => handleConfigChange('syncOnAppStateChange', value)}
            trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
            thumbColor={localConfig.syncOnAppStateChange ? '#fff' : theme.colors.onSurfaceVariant}
          />
        </View>
      </View>

      {/* Sync Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{syncStats.totalSynced}</Text>
            <Text style={styles.statLabel}>Total Synced</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{syncStats.successfulSyncs}</Text>
            <Text style={styles.statLabel}>Successful</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{syncStats.failedSyncs}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{cacheStats.totalItems}</Text>
            <Text style={styles.statLabel}>Cached Items</Text>
          </View>
        </View>

        <View style={styles.lastSync}>
          <Text style={styles.lastSyncLabel}>Last Sync:</Text>
          <Text style={styles.lastSyncValue}>
            {formatTime(syncStats.lastSyncTime)}
          </Text>
        </View>
      </View>

      {/* Cache Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cache Management</Text>
        
        <View style={styles.cacheInfo}>
          <Text style={styles.cacheSize}>
            Cache Size: {formatBytes(cacheStats.cacheSize)}
          </Text>
          <Text style={styles.cacheItems}>
            Items: {cacheStats.totalItems}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePreloadData}
          disabled={!isOnline}
        >
          <Icon name="download" size={20} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Preload Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={handleClearCache}
        >
          <Icon name="clear" size={20} color={theme.colors.error} />
          <Text style={[styles.actionButtonText, styles.clearButtonText]}>
            Clear Cache
          </Text>
        </TouchableOpacity>
      </View>

      {/* Failed Syncs */}
      {failedSyncs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Failed Syncs</Text>
          <Text style={styles.failedCount}>
            {failedSyncs.length} failed syncs
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Navigate to failed syncs screen
            }}
          >
            <Icon name="error" size={20} color={theme.colors.error} />
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Conflicts</Text>
          <Text style={styles.conflictCount}>
            {conflicts.length} unresolved conflicts
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Navigate to conflicts screen
            }}
          >
            <Icon name="warning" size={20} color={theme.colors.warning} />
            <Text style={styles.actionButtonText}>Resolve Conflicts</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Manual Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manual Actions</Text>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.syncButton]}
          onPress={handleSyncNow}
          disabled={syncInProgress}
        >
          <Icon 
            name={syncInProgress ? "sync" : "sync"} 
            size={20} 
            color={syncInProgress ? theme.colors.onSurfaceVariant : theme.colors.primary} 
          />
          <Text style={[
            styles.actionButtonText,
            syncInProgress && styles.disabledText
          ]}>
            {syncInProgress ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginLeft: 12,
  },
  pendingSync: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  pendingText: {
    fontSize: 14,
    color: theme.colors.warning,
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  valueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  valueText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginRight: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    marginRight: '2%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  lastSync: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastSyncLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  lastSyncValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  cacheInfo: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cacheSize: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  cacheItems: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.primary,
    marginLeft: 8,
  },
  clearButton: {
    borderColor: theme.colors.error,
  },
  clearButtonText: {
    color: theme.colors.error,
  },
  syncButton: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  disabledText: {
    color: theme.colors.onSurfaceVariant,
  },
  failedCount: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: 12,
  },
  conflictCount: {
    fontSize: 14,
    color: theme.colors.warning,
    marginBottom: 12,
  },
  bottomSpacer: {
    height: 32,
  },
});

