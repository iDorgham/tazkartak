import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { VenueStackParamList } from '@/navigation/VenueNavigator';
import { RootState } from '@/store';

type VenueTeamScreenNavigationProp = StackNavigationProp<VenueStackParamList, 'VenueTeam'>;
type VenueTeamScreenRouteProp = RouteProp<VenueStackParamList, 'VenueTeam'>;

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'scanner' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: string;
  lastActive?: string;
  permissions: {
    canScan: boolean;
    canViewAnalytics: boolean;
    canManageEvents: boolean;
    canEditVenue: boolean;
    canManageTeam: boolean;
  };
}

interface InviteMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  visible,
  onClose,
  onInvite,
}) => {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'scanner' | 'viewer'>('scanner');

  const handleInvite = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    onInvite(email.trim(), selectedRole);
    setEmail('');
    setSelectedRole('scanner');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Invite Team Member</Text>
          <TouchableOpacity onPress={handleInvite}>
            <Text style={styles.inviteButton}>Invite</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleOptions}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'scanner' && styles.roleOptionSelected,
                ]}
                onPress={() => setSelectedRole('scanner')}
              >
                <Icon
                  name="qr-code-scanner"
                  size={24}
                  color={selectedRole === 'scanner' ? '#fff' : theme.colors.primary}
                />
                <Text
                  style={[
                    styles.roleOptionText,
                    selectedRole === 'scanner' && styles.roleOptionTextSelected,
                  ]}
                >
                  Scanner
                </Text>
                <Text
                  style={[
                    styles.roleOptionDesc,
                    selectedRole === 'scanner' && styles.roleOptionDescSelected,
                  ]}
                >
                  Can scan tickets and check-in attendees
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'viewer' && styles.roleOptionSelected,
                ]}
                onPress={() => setSelectedRole('viewer')}
              >
                <Icon
                  name="visibility"
                  size={24}
                  color={selectedRole === 'viewer' ? '#fff' : theme.colors.primary}
                />
                <Text
                  style={[
                    styles.roleOptionText,
                    selectedRole === 'viewer' && styles.roleOptionTextSelected,
                  ]}
                >
                  Viewer
                </Text>
                <Text
                  style={[
                    styles.roleOptionDesc,
                    selectedRole === 'viewer' && styles.roleOptionDescSelected,
                  ]}
                >
                  Can view analytics and reports only
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface TeamMemberItemProps {
  member: TeamMember;
  onPress: (member: TeamMember) => void;
  onRemove: (memberId: string) => void;
}

const TeamMemberItem: React.FC<TeamMemberItemProps> = ({
  member,
  onPress,
  onRemove,
}) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#E91E63';
      case 'scanner':
        return '#2196F3';
      case 'viewer':
        return '#4CAF50';
      default:
        return theme.colors.outline;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'inactive':
        return '#FF5722';
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
      style={styles.memberItem}
      onPress={() => onPress(member)}
      activeOpacity={0.7}
    >
      <View style={styles.memberAvatar}>
        <Text style={styles.memberInitial}>
          {member.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberEmail}>{member.email}</Text>
        <Text style={styles.memberJoined}>
          Joined {formatDate(member.joinedAt)}
        </Text>
      </View>

      <View style={styles.memberStatus}>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
          <Text style={styles.roleBadgeText}>
            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(member.status) }]}>
          <Text style={styles.statusBadgeText}>
            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(member.id)}
      >
        <Icon name="more-vert" size={20} color={theme.colors.onSurfaceVariant} />
      </TouchableOpacity>
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

export const VenueTeamScreen: React.FC = () => {
  const navigation = useNavigation<VenueTeamScreenNavigationProp>();
  const route = useRoute<VenueTeamScreenRouteProp>();
  const { venueId } = route.params;

  const dispatch = useDispatch();
  const { venues } = useSelector((state: RootState) => state.venues);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');

  // Mock data - replace with actual API calls
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      status: 'active',
      joinedAt: '2024-01-15',
      lastActive: '2024-03-10',
      permissions: {
        canScan: true,
        canViewAnalytics: true,
        canManageEvents: true,
        canEditVenue: true,
        canManageTeam: true,
      },
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'scanner',
      status: 'active',
      joinedAt: '2024-02-01',
      lastActive: '2024-03-09',
      permissions: {
        canScan: true,
        canViewAnalytics: false,
        canManageEvents: false,
        canEditVenue: false,
        canManageTeam: false,
      },
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'viewer',
      status: 'pending',
      joinedAt: '2024-03-05',
      permissions: {
        canScan: false,
        canViewAnalytics: true,
        canManageEvents: false,
        canEditVenue: false,
        canManageTeam: false,
      },
    },
  ]);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      // dispatch(fetchVenueTeam(venueId));
      // Mock loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to load team members:', error);
      Alert.alert('Error', 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberPress = (member: TeamMember) => {
    navigation.navigate('TeamPermissions', {
      venueId,
      teamMemberId: member.id,
    });
  };

  const handleRemoveMember = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    
    Alert.alert(
      'Remove Team Member',
      `Are you sure you want to remove ${member?.name} from the team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // dispatch(removeTeamMember({ venueId, memberId }));
              Alert.alert('Success', 'Team member removed successfully');
              await loadTeamMembers();
            } catch (error) {
              console.error('Failed to remove team member:', error);
              Alert.alert('Error', 'Failed to remove team member');
            }
          },
        },
      ]
    );
  };

  const handleInviteMember = async (email: string, role: string) => {
    try {
      // dispatch(inviteTeamMember({ venueId, email, role }));
      Alert.alert(
        'Invitation Sent',
        `Invitation sent to ${email} with ${role} role`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowInviteModal(false);
              loadTeamMembers();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to invite team member:', error);
      Alert.alert('Error', 'Failed to send invitation');
    }
  };

  const getFilteredMembers = (): TeamMember[] => {
    let filtered = teamMembers;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by tab
    if (activeTab === 'active') {
      filtered = filtered.filter(member => member.status === 'active');
    } else if (activeTab === 'pending') {
      filtered = filtered.filter(member => member.status === 'pending');
    }

    return filtered;
  };

  const getStats = () => {
    const activeMembers = teamMembers.filter(member => member.status === 'active').length;
    const pendingMembers = teamMembers.filter(member => member.status === 'pending').length;
    const scannerMembers = teamMembers.filter(member => member.role === 'scanner').length;
    const adminMembers = teamMembers.filter(member => member.role === 'admin').length;

    return { activeMembers, pendingMembers, scannerMembers, adminMembers };
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="people" size={64} color={theme.colors.outline} />
      <Text style={styles.emptyTitle}>
        {activeTab === 'pending' ? 'No Pending Invitations' : 'No Team Members'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'pending'
          ? 'All invitations have been accepted'
          : 'Invite team members to help manage your venue'}
      </Text>
    </View>
  );

  const stats = getStats();
  const filteredMembers = getFilteredMembers();

  return (
    <View style={styles.container}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatsCard
          title="Active Members"
          value={stats.activeMembers}
          icon="people"
          color={theme.colors.primary}
        />
        <StatsCard
          title="Pending"
          value={stats.pendingMembers}
          icon="hourglass-empty"
          color="#FF9800"
        />
        <StatsCard
          title="Scanners"
          value={stats.scannerMembers}
          icon="qr-code-scanner"
          color="#2196F3"
        />
        <StatsCard
          title="Admins"
          value={stats.adminMembers}
          icon="admin-panel-settings"
          color="#E91E63"
        />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color={theme.colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search team members..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'active' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'active' && styles.tabButtonTextActive,
            ]}
          >
            Active ({stats.activeMembers})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'pending' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('pending')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'pending' && styles.tabButtonTextActive,
            ]}
          >
            Pending ({stats.pendingMembers})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Team Members List */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TeamMemberItem
            member={item}
            onPress={handleMemberPress}
            onRemove={handleRemoveMember}
          />
        )}
        contentContainerStyle={[
          styles.listContainer,
          filteredMembers.length === 0 && styles.emptyListContainer,
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowInviteModal(true)}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Invite Modal */}
      <InviteMemberModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteMember}
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
  searchContainer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.onSurface,
    marginLeft: 8,
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
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  memberItem: {
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
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  memberJoined: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  memberStatus: {
    alignItems: 'flex-end',
    marginRight: 8,
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
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    backgroundColor: theme.colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  inviteButton: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surface,
  },
  roleOptions: {
    gap: 12,
  },
  roleOption: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'transparent',
  },
  roleOptionSelected: {
    backgroundColor: theme.colors.primary,
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 8,
  },
  roleOptionTextSelected: {
    color: '#fff',
  },
  roleOptionDesc: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  roleOptionDescSelected: {
    color: '#fff',
    opacity: 0.9,
  },
});