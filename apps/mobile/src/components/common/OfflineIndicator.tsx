import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NetInfo from '@react-native-community/netinfo';

import { theme } from '@/config/theme';
import { RootState } from '@/store';
import { fetchOfflineStats } from '@/store/offline.slice';

interface OfflineIndicatorProps {
  onRetryPress?: () => void;
  showSyncStats?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  onRetryPress,
  showSyncStats = false,
}) => {
  const dispatch = useDispatch();
  const { isOnline, syncInProgress, pendingSyncCount, syncStats } = useSelector(
    (state: RootState) => state.offline
  );

  const [slideAnim] = useState(new Animated.Value(-100));
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, slideAnim]);

  const handleRetryPress = () => {
    if (onRetryPress) {
      onRetryPress();
    } else {
      // Default retry action - trigger sync
      dispatch(performSync());
    }
  };

  const handleDetailsPress = () => {
    setShowDetails(!showDetails);
    if (!showDetails) {
      dispatch(fetchOfflineStats());
    }
  };

  if (isOnline && !pendingSyncCount) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.indicator}>
        <View style={styles.statusRow}>
          <View style={styles.statusInfo}>
            <Icon
              name={isOnline ? 'cloud-done' : 'cloud-off'}
              size={20}
              color={isOnline ? theme.colors.success : theme.colors.error}
            />
            <Text style={styles.statusText}>
              {isOnline ? 'Syncing...' : 'Offline Mode'}
            </Text>
            {pendingSyncCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingSyncCount}</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            {!isOnline && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetryPress}
                disabled={syncInProgress}
              >
                <Icon
                  name="refresh"
                  size={16}
                  color={theme.colors.onError}
                />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={handleDetailsPress}
            >
              <Icon
                name={showDetails ? 'expand-less' : 'expand-more'}
                size={20}
                color={theme.colors.onError}
              />
            </TouchableOpacity>
          </View>
        </View>

        {showDetails && (
          <View style={styles.detailsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={styles.statValue}>{pendingSyncCount}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Synced</Text>
                <Text style={styles.statValue}>{syncStats.successfulSyncs}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Failed</Text>
                <Text style={styles.statValue}>{syncStats.failedSyncs}</Text>
              </View>
            </View>

            {syncInProgress && (
              <View style={styles.syncIndicator}>
                <View style={styles.syncBar}>
                  <Animated.View style={styles.syncProgress} />
                </View>
                <Text style={styles.syncText}>Syncing data...</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.manualSyncButton}
              onPress={() => dispatch(forceSyncAll())}
              disabled={syncInProgress}
            >
              <Icon name="sync" size={16} color={theme.colors.primary} />
              <Text style={styles.manualSyncText}>Sync Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10,
  },
  indicator: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    color: theme.colors.onError,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  badge: {
    backgroundColor: theme.colors.onError,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  retryText: {
    color: theme.colors.onError,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsButton: {
    padding: 4,
  },
  detailsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: theme.colors.onError,
    fontSize: 12,
    opacity: 0.8,
  },
  statValue: {
    color: theme.colors.onError,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  syncIndicator: {
    marginBottom: 12,
  },
  syncBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  syncProgress: {
    height: '100%',
    backgroundColor: theme.colors.onError,
    width: '100%',
    // Add animation here if needed
  },
  syncText: {
    color: theme.colors.onError,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  manualSyncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  manualSyncText: {
    color: theme.colors.onError,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

// Online indicator for when connection is restored
export const OnlineIndicator: React.FC = () => {
  const [slideAnim] = useState(new Animated.Value(-100));
  const [show, setShow] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && show) {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start(() => {
          setTimeout(() => {
            Animated.timing(slideAnim, {
              toValue: -100,
              duration: 300,
              useNativeDriver: true,
            }).start(() => setShow(false));
          }, 2000);
        });
      }
    });

    return unsubscribe;
  }, [slideAnim, show]);

  if (!show) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.onlineContainer,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.onlineIndicator}>
        <Icon name="cloud-done" size={20} color={theme.colors.success} />
        <Text style={styles.onlineText}>Back Online</Text>
      </View>
    </Animated.View>
  );
};

const onlineStyles = StyleSheet.create({
  onlineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10,
  },
  onlineIndicator: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  onlineText: {
    color: theme.colors.onSuccess,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OfflineIndicator;

