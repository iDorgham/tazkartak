import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { AdminStackParamList } from '@/navigation/AdminNavigator';
import { RootState } from '@/store';
import { User, UserRole, UserStatus } from '@/types/auth.types';

type UserDetailsScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'UserDetails'>;
type UserDetailsScreenRouteProp = RouteProp<AdminStackParamList, 'UserDetails'>;

interface ActivityItemProps {
  activity: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    details?: string;
  };
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'login':
        return 'login';
      case 'logout':
        return 'logout';
      case 'profile_update':
        return 'edit';
      case 'password_change':
        return 'lock';
      case 'event_created':
        return 'event';
      case 'ticket_purchased':
        return 'confirmation-number';
      default:
        return 'info';
    }
  };

  const getActivityColor = () => {
    switch (activity.type) {
      case 'login':
        return '#4CAF50';
      case 'logout':
        return '#FF5722';
      case 'profile_update':
        return '#2196F3';
      case 'password_change':
        return '#FF9800';
      case 'event_created':
        return '#9C27B0';
      case 'ticket_purchased':
        return '#00BCD4';
      default:
        return theme.colors.primary;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: getActivityColor() }]}>
        <Icon name={getActivityIcon()} size={16} color="#fff" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        {activity.details && (
          <Text style={styles.activityDetails}>{activity.details}</Text>
        )}
        <Text style={styles.activityTime}>{formatTime(activity.timestamp)}</Text>
      </View>
    </View>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <View style={styles.statCard}>
    <Icon name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

export const UserDetailsScreen: React.FC = () => {
  const navigation = useNavigation<UserDetailsScreenNavigationProp>();
  const route = useRoute<UserDetailsScreenRouteProp>();
  const { userId } = route.params;

  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});

  // Mock data - replace with actual API calls
  const mockUser: User = {
    id: userId,
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
  };

  const [userActivities] = useState([
    {
      id: '1',
      type: 'login',
      description: 'User logged in',
      timestamp: '2024-03-10T10:30:00Z',
      details: 'IP: 192.168.1.100, Device: iPhone 14 Pro',
    },
    {
      id: '2',
      type: 'event_created',
      description: 'Created event "Tech Conference 2024"',
      timestamp: '2024-03-09T15:45:00Z',
      details: 'Event ID: evt_123456',
    },
    {
      id: '3',
      type: 'profile_update',
      description: 'Updated profile information',
      timestamp: '2024-03-08T12:20:00Z',
      details: 'Updated phone number',
    },
    {
      id: '4',
      type: 'password_change',
      description: 'Password changed',
      timestamp: '2024-03-05T09:15:00Z',
    },
  ]);

  const [userStats] = useState({
    totalEvents: 12,
    totalRevenue: 'EGP 45,600',
    totalTicketsSold: 234,
    lastActivity: '2 hours ago',
  });

  useEffect(() => {
    loadUserDetails();
  }, []);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      // dispatch(fetchUserDetails(userId));
      
      // Mock loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUser(mockUser);
    } catch (error) {
      console.error('Failed to load user details:', error);
      Alert.alert('Error', 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = () => {
    setIsEditing(true);
    setEditData({
      name: user?.name,
      email: user?.email,
      role: user?.role,
      status: user?.status,
    });
  };

  const handleSaveUser = async () => {
    try {
      // dispatch(updateUser({ userId, data: editData }));
      setUser({ ...user, ...editData } as User);
      setIsEditing(false);
      Alert.alert('Success', 'User updated successfully');
    } catch (error) {
      console.error('Failed to update user:', error);
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleSuspendUser = () => {
    Alert.alert(
      'Suspend User',
      `Are you sure you want to suspend ${user?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              // dispatch(suspendUser(userId));
              setUser({ ...user, status: 'suspended' } as User);
              Alert.alert('Success', 'User suspended successfully');
            } catch (error) {
              console.error('Failed to suspend user:', error);
              Alert.alert('Error', 'Failed to suspend user');
            }
          },
        },
      ]
    );
  };

  const handleActivateUser = () => {
    Alert.alert(
      'Activate User',
      `Are you sure you want to activate ${user?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            try {
              // dispatch(activateUser(userId));
              setUser({ ...user, status: 'active' } as User);
              Alert.alert('Success', 'User activated successfully');
            } catch (error) {
              console.error('Failed to activate user:', error);
              Alert.alert('Error', 'Failed to activate user');
            }
          },
        },
      ]
    );
  };

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
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading user details...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color={theme.colors.error} />
        <Text style={styles.errorTitle}>User Not Found</Text>
        <Text style={styles.errorText}>
          The requested user could not be found.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* User Header */}
      <View style={styles.header}>
        <View style={styles.userAvatar}>
          <Text style={styles.userInitial}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.userBadges}>
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
          </View>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={handleEditUser}>
          <Icon name="edit" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* User Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Events"
          value={userStats.totalEvents}
          icon="event"
          color={theme.colors.primary}
        />
        <StatCard
          title="Total Revenue"
          value={userStats.totalRevenue}
          icon="attach-money"
          color="#4CAF50"
        />
        <StatCard
          title="Tickets Sold"
          value={userStats.totalTicketsSold}
          icon="confirmation-number"
          color="#FF9800"
        />
        <StatCard
          title="Last Activity"
          value={userStats.lastActivity}
          icon="schedule"
          color="#2196F3"
        />
      </View>

      {/* Edit Form */}
      {isEditing && (
        <View style={styles.editForm}>
          <Text style={styles.editFormTitle}>Edit User Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={editData.name || ''}
              onChangeText={(text) => setEditData({ ...editData, name: text })}
              placeholder="Enter name"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={editData.email || ''}
              onChangeText={(text) => setEditData({ ...editData, email: text })}
              placeholder="Enter email"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleOptions}>
              {(['admin', 'organizer', 'venue', 'buyer'] as UserRole[]).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    editData.role === role && styles.roleOptionSelected,
                  ]}
                  onPress={() => setEditData({ ...editData, role })}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      editData.role === role && styles.roleOptionTextSelected,
                    ]}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusOptions}>
              {(['active', 'suspended', 'pending', 'inactive'] as UserStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    editData.status === status && styles.statusOptionSelected,
                  ]}
                  onPress={() => setEditData({ ...editData, status })}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      editData.status === status && styles.statusOptionTextSelected,
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveUser}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* User Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>User Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>
              {user.profile?.firstName} {user.profile?.lastName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user.profile?.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Birth</Text>
            <Text style={styles.infoValue}>
              {user.profile?.dateOfBirth ? formatDate(user.profile.dateOfBirth) : 'Not provided'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>
              {user.profile?.gender ? user.profile.gender.charAt(0).toUpperCase() + user.profile.gender.slice(1) : 'Not provided'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Verified</Text>
            <Text style={[styles.infoValue, { color: user.emailVerified ? '#4CAF50' : '#FF5722' }]}>
              {user.emailVerified ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Login</Text>
            <Text style={styles.infoValue}>
              {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          {user.status === 'active' ? (
            <TouchableOpacity style={styles.suspendButton} onPress={handleSuspendUser}>
              <Icon name="block" size={20} color="#fff" />
              <Text style={styles.suspendButtonText}>Suspend User</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.activateButton} onPress={handleActivateUser}>
              <Icon name="check-circle" size={20} color="#fff" />
              <Text style={styles.activateButtonText}>Activate User</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.messageButton}>
            <Icon name="message" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.activitiesSection}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        <View style={styles.activitiesList}>
          {userActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </View>
      </View>
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
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  userBadges: {
    flexDirection: 'row',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
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
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
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
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  editForm: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.background,
  },
  roleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: 'transparent',
  },
  roleOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleOptionText: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  roleOptionTextSelected: {
    color: '#fff',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: 'transparent',
  },
  statusOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusOptionText: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  statusOptionTextSelected: {
    color: '#fff',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  infoSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  actionsSection: {
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  suspendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF5722',
  },
  suspendButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  activateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  activateButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2196F3',
  },
  messageButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  activitiesSection: {
    padding: 16,
  },
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
});
