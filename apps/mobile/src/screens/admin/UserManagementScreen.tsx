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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { AdminStackParamList } from '@/navigation/AdminNavigator';
import { RootState } from '@/store';
import { User, UserRole, UserStatus } from '@/types/auth.types';

type UserManagementScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'UserManagement'>;

interface UserItemProps {
  user: User;
  onPress: (user: User) => void;
  onSuspend: (userId: string) => void;
  onActivate: (userId: string) => void;
}

const UserItem: React.FC<UserItemProps> = ({ user, onPress, onSuspend, onActivate }) => {
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return '#E91E63';
      case 'organizer':
        return '#2196F3';
      case 'venue':
        return '#9C27B0';
      case 'buyer':
        return '#4CAF50';
      default:
        return theme.colors.outline;
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'suspended':
        return '#FF5722';
      case 'pending':
        return '#FF9800';
      case 'inactive':
        return '#9E9E9E';
      default:
        return theme.colors.outline;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleSuspend = () => {
    Alert.alert(
      'Suspend User',
      `Are you sure you want to suspend ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: () => onSuspend(user.id),
        },
      ]
    );
  };

  const handleActivate = () => {
    Alert.alert(
      'Activate User',
      `Are you sure you want to activate ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: () => onActivate(user.id),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => onPress(user)}
      activeOpacity={0.7}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userInitial}>
          {user.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.userJoined}>
          Joined {formatDate(user.createdAt)}
        </Text>
      </View>

      <View style={styles.userStatus}>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
          <Text style={styles.roleBadgeText}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.status) }]}>
          <Text style={styles.statusBadgeText}>
            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
          </Text>
        </View>
        
        <View style={styles.userActions}>
          {user.status === 'active' ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSuspend}
            >
              <Icon name="block" size={16} color="#FF5722" />
              <Text style={styles.actionText}>Suspend</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleActivate}
            >
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.actionText}>Activate</Text>
            </TouchableOpacity>
          )}
        </View>
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

export const UserManagementScreen: React.FC = () => {
  const navigation = useNavigation<UserManagementScreenNavigationProp>();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt' | 'lastLogin'>('createdAt');

  // Mock data - replace with actual API calls
  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'Ahmed Hassan',
      email: 'ahmed@example.com',
      role: 'organizer',
      status: 'active',
      emailVerified: true,
      createdAt: '2024-01-15',
      updatedAt: '2024-03-10',
      lastLogin: '2024-03-10T10:30:00Z',
      profile: {
        firstName: 'Ahmed',
        lastName: 'Hassan',
        phone: '+20 123 456 7890',
        dateOfBirth: '1990-05-15',
        gender: 'male',
        avatar: null,
      },
    },
    {
      id: '2',
      name: 'Sarah Mohamed',
      email: 'sarah@example.com',
      role: 'venue',
      status: 'active',
      emailVerified: true,
      createdAt: '2024-02-01',
      updatedAt: '2024-03-09',
      lastLogin: '2024-03-09T15:45:00Z',
      profile: {
        firstName: 'Sarah',
        lastName: 'Mohamed',
        phone: '+20 987 654 3210',
        dateOfBirth: '1985-08-22',
        gender: 'female',
        avatar: null,
      },
    },
    {
      id: '3',
      name: 'Omar Ali',
      email: 'omar@example.com',
      role: 'buyer',
      status: 'suspended',
      emailVerified: false,
      createdAt: '2024-02-15',
      updatedAt: '2024-03-05',
      lastLogin: '2024-03-05T09:20:00Z',
      profile: {
        firstName: 'Omar',
        lastName: 'Ali',
        phone: '+20 555 123 4567',
        dateOfBirth: '1992-12-03',
        gender: 'male',
        avatar: null,
      },
    },
    {
      id: '4',
      name: 'Fatma Ibrahim',
      email: 'fatma@example.com',
      role: 'admin',
      status: 'active',
      emailVerified: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-03-11',
      lastLogin: '2024-03-11T08:15:00Z',
      profile: {
        firstName: 'Fatma',
        lastName: 'Ibrahim',
        phone: '+20 111 222 3333',
        dateOfBirth: '1988-03-18',
        gender: 'female',
        avatar: null,
      },
    },
  ]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // dispatch(fetchAllUsers());
      // Mock loading
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to load users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUsers();
    } catch (error) {
      console.error('Failed to refresh users:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleUserPress = (user: User) => {
    navigation.navigate('UserDetails', { userId: user.id });
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      // dispatch(suspendUser(userId));
      Alert.alert('Success', 'User suspended successfully');
      await loadUsers();
    } catch (error) {
      console.error('Failed to suspend user:', error);
      Alert.alert('Error', 'Failed to suspend user');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      // dispatch(activateUser(userId));
      Alert.alert('Success', 'User activated successfully');
      await loadUsers();
    } catch (error) {
      console.error('Failed to activate user:', error);
      Alert.alert('Error', 'Failed to activate user');
    }
  };

  const getFilteredUsers = (): User[] => {
    let filtered = users;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Sort users
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'lastLogin':
          return new Date(b.lastLogin || 0).getTime() - new Date(a.lastLogin || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'active').length;
    const suspendedUsers = users.filter(user => user.status === 'suspended').length;
    const pendingUsers = users.filter(user => user.status === 'pending').length;

    return { totalUsers, activeUsers, suspendedUsers, pendingUsers };
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="people" size={64} color={theme.colors.outline} />
      <Text style={styles.emptyTitle}>No Users Found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search or filter criteria
      </Text>
    </View>
  );

  const stats = getStats();
  const filteredUsers = getFilteredUsers();

  return (
    <View style={styles.container}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon="people"
          color={theme.colors.primary}
        />
        <StatsCard
          title="Active"
          value={stats.activeUsers}
          icon="check-circle"
          color="#4CAF50"
        />
        <StatsCard
          title="Suspended"
          value={stats.suspendedUsers}
          icon="block"
          color="#FF5722"
        />
        <StatsCard
          title="Pending"
          value={stats.pendingUsers}
          icon="hourglass-empty"
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
            placeholder="Search users..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>

        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              // Show sort options
              Alert.alert(
                'Sort Users',
                'Choose sorting option:',
                [
                  { text: 'Name', onPress: () => setSortBy('name') },
                  { text: 'Email', onPress: () => setSortBy('email') },
                  { text: 'Join Date', onPress: () => setSortBy('createdAt') },
                  { text: 'Last Login', onPress: () => setSortBy('lastLogin') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
          >
            <Icon name="sort" size={16} color={theme.colors.primary} />
            <Text style={styles.filterButtonText}>Sort</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Role Filter */}
      <View style={styles.roleFilter}>
        {(['all', 'admin', 'organizer', 'venue', 'buyer'] as const).map((role) => (
          <TouchableOpacity
            key={role}
            style={[
              styles.roleButton,
              roleFilter === role && styles.roleButtonActive,
            ]}
            onPress={() => setRoleFilter(role)}
          >
            <Text
              style={[
                styles.roleButtonText,
                roleFilter === role && styles.roleButtonTextActive,
              ]}
            >
              {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status Filter */}
      <View style={styles.statusFilter}>
        {(['all', 'active', 'suspended', 'pending', 'inactive'] as const).map((status) => (
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
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserItem
            user={item}
            onPress={handleUserPress}
            onSuspend={handleSuspendUser}
            onActivate={handleActivateUser}
          />
        )}
        contentContainerStyle={[
          styles.listContainer,
          filteredUsers.length === 0 && styles.emptyListContainer,
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  roleFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  roleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
  },
  roleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  roleButtonText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: theme.colors.onPrimary,
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
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  userItem: {
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
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  userJoined: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  userStatus: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  userActions: {
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  actionText: {
    fontSize: 12,
    color: theme.colors.onSurface,
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