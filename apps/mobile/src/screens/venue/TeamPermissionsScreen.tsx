import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { VenueStackParamList } from '@/navigation/VenueNavigator';
import { RootState } from '@/store';

type TeamPermissionsScreenNavigationProp = StackNavigationProp<VenueStackParamList, 'TeamPermissions'>;
type TeamPermissionsScreenRouteProp = RouteProp<VenueStackParamList, 'TeamPermissions'>;

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'scanner' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  permissions: {
    canScan: boolean;
    canViewAnalytics: boolean;
    canManageEvents: boolean;
    canEditVenue: boolean;
    canManageTeam: boolean;
  };
}

interface PermissionItemProps {
  title: string;
  description: string;
  icon: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const PermissionItem: React.FC<PermissionItemProps> = ({
  title,
  description,
  icon,
  value,
  onValueChange,
  disabled = false,
}) => (
  <View style={[styles.permissionItem, disabled && styles.permissionItemDisabled]}>
    <View style={styles.permissionIcon}>
      <Icon
        name={icon}
        size={24}
        color={disabled ? theme.colors.outline : theme.colors.primary}
      />
    </View>
    <View style={styles.permissionInfo}>
      <Text style={[styles.permissionTitle, disabled && styles.permissionTitleDisabled]}>
        {title}
      </Text>
      <Text style={[styles.permissionDesc, disabled && styles.permissionDescDisabled]}>
        {description}
      </Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{
        false: theme.colors.surfaceVariant,
        true: theme.colors.primary,
      }}
      thumbColor={value ? '#fff' : theme.colors.outline}
    />
  </View>
);

interface PermissionPresetProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
  isSelected: boolean;
}

const PermissionPreset: React.FC<PermissionPresetProps> = ({
  title,
  description,
  icon,
  onPress,
  isSelected,
}) => (
  <TouchableOpacity
    style={[
      styles.presetItem,
      isSelected && styles.presetItemSelected,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.presetIcon}>
      <Icon
        name={icon}
        size={24}
        color={isSelected ? '#fff' : theme.colors.primary}
      />
    </View>
    <View style={styles.presetInfo}>
      <Text
        style={[
          styles.presetTitle,
          isSelected && styles.presetTitleSelected,
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.presetDesc,
          isSelected && styles.presetDescSelected,
        ]}
      >
        {description}
      </Text>
    </View>
    {isSelected && (
      <Icon name="check" size={20} color="#fff" />
    )}
  </TouchableOpacity>
);

export const TeamPermissionsScreen: React.FC = () => {
  const navigation = useNavigation<TeamPermissionsScreenNavigationProp>();
  const route = useRoute<TeamPermissionsScreenRouteProp>();
  const { venueId, teamMemberId } = route.params;

  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [permissions, setPermissions] = useState({
    canScan: false,
    canViewAnalytics: false,
    canManageEvents: false,
    canEditVenue: false,
    canManageTeam: false,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Mock data - replace with actual API calls
  const mockTeamMember: TeamMember = {
    id: teamMemberId,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'scanner',
    status: 'active',
    permissions: {
      canScan: true,
      canViewAnalytics: false,
      canManageEvents: false,
      canEditVenue: false,
      canManageTeam: false,
    },
  };

  useEffect(() => {
    loadTeamMember();
  }, []);

  useEffect(() => {
    // Check if permissions have changed
    if (teamMember) {
      const originalPermissions = teamMember.permissions;
      const hasPermissionChanges = Object.keys(permissions).some(
        key => permissions[key as keyof typeof permissions] !== originalPermissions[key as keyof typeof originalPermissions]
      );
      setHasChanges(hasPermissionChanges);
    }
  }, [permissions, teamMember]);

  const loadTeamMember = async () => {
    try {
      setLoading(true);
      // dispatch(fetchTeamMember({ venueId, teamMemberId }));
      
      // Mock loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTeamMember(mockTeamMember);
      setPermissions(mockTeamMember.permissions);
    } catch (error) {
      console.error('Failed to load team member:', error);
      Alert.alert('Error', 'Failed to load team member details');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permission: keyof typeof permissions, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: value,
    }));
  };

  const applyPreset = (presetType: 'scanner' | 'manager' | 'admin') => {
    const presets = {
      scanner: {
        canScan: true,
        canViewAnalytics: false,
        canManageEvents: false,
        canEditVenue: false,
        canManageTeam: false,
      },
      manager: {
        canScan: true,
        canViewAnalytics: true,
        canManageEvents: true,
        canEditVenue: false,
        canManageTeam: false,
      },
      admin: {
        canScan: true,
        canViewAnalytics: true,
        canManageEvents: true,
        canEditVenue: true,
        canManageTeam: true,
      },
    };

    setPermissions(presets[presetType]);
  };

  const getCurrentPreset = (): 'scanner' | 'manager' | 'admin' | 'custom' => {
    if (
      permissions.canScan &&
      !permissions.canViewAnalytics &&
      !permissions.canManageEvents &&
      !permissions.canEditVenue &&
      !permissions.canManageTeam
    ) {
      return 'scanner';
    }
    
    if (
      permissions.canScan &&
      permissions.canViewAnalytics &&
      permissions.canManageEvents &&
      !permissions.canEditVenue &&
      !permissions.canManageTeam
    ) {
      return 'manager';
    }
    
    if (
      permissions.canScan &&
      permissions.canViewAnalytics &&
      permissions.canManageEvents &&
      permissions.canEditVenue &&
      permissions.canManageTeam
    ) {
      return 'admin';
    }
    
    return 'custom';
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // dispatch(updateTeamPermissions({ venueId, teamMemberId, permissions }));
      
      // Mock saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Success',
        'Permissions updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save permissions:', error);
      Alert.alert('Error', 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Permissions',
      'Are you sure you want to reset all permissions to their original values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            if (teamMember) {
              setPermissions(teamMember.permissions);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading team member details...</Text>
      </View>
    );
  }

  if (!teamMember) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color={theme.colors.error} />
        <Text style={styles.errorTitle}>Team Member Not Found</Text>
        <Text style={styles.errorText}>
          The requested team member could not be found.
        </Text>
      </View>
    );
  }

  const currentPreset = getCurrentPreset();

  return (
    <ScrollView style={styles.container}>
      {/* Team Member Header */}
      <View style={styles.memberHeader}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberInitial}>
            {teamMember.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{teamMember.name}</Text>
          <Text style={styles.memberEmail}>{teamMember.email}</Text>
          <View style={styles.memberRole}>
            <Text style={styles.roleText}>
              {teamMember.role.charAt(0).toUpperCase() + teamMember.role.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Permission Presets */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Presets</Text>
        <Text style={styles.sectionSubtitle}>
          Apply common permission sets or customize individually
        </Text>

        <View style={styles.presetsContainer}>
          <PermissionPreset
            title="Scanner"
            description="Can scan tickets and check-in attendees"
            icon="qr-code-scanner"
            onPress={() => applyPreset('scanner')}
            isSelected={currentPreset === 'scanner'}
          />
          <PermissionPreset
            title="Manager"
            description="Can scan tickets, view analytics, and manage events"
            icon="manage-accounts"
            onPress={() => applyPreset('manager')}
            isSelected={currentPreset === 'manager'}
          />
          <PermissionPreset
            title="Admin"
            description="Full access to all venue features"
            icon="admin-panel-settings"
            onPress={() => applyPreset('admin')}
            isSelected={currentPreset === 'admin'}
          />
        </View>
      </View>

      {/* Individual Permissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Individual Permissions</Text>
        <Text style={styles.sectionSubtitle}>
          Fine-tune specific permissions for this team member
        </Text>

        <View style={styles.permissionsContainer}>
          <PermissionItem
            title="Scan Tickets"
            description="Scan QR codes and check-in attendees at events"
            icon="qr-code-scanner"
            value={permissions.canScan}
            onValueChange={(value) => handlePermissionChange('canScan', value)}
          />

          <PermissionItem
            title="View Analytics"
            description="Access event analytics, reports, and performance metrics"
            icon="analytics"
            value={permissions.canViewAnalytics}
            onValueChange={(value) => handlePermissionChange('canViewAnalytics', value)}
          />

          <PermissionItem
            title="Manage Events"
            description="Create, edit, and manage events for this venue"
            icon="event"
            value={permissions.canManageEvents}
            onValueChange={(value) => handlePermissionChange('canManageEvents', value)}
          />

          <PermissionItem
            title="Edit Venue"
            description="Modify venue details, photos, and settings"
            icon="edit-location"
            value={permissions.canEditVenue}
            onValueChange={(value) => handlePermissionChange('canEditVenue', value)}
          />

          <PermissionItem
            title="Manage Team"
            description="Invite team members and manage their permissions"
            icon="group"
            value={permissions.canManageTeam}
            onValueChange={(value) => handlePermissionChange('canManageTeam', value)}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          disabled={!hasChanges}
        >
          <Icon name="refresh" size={20} color={theme.colors.primary} />
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!hasChanges || saving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <Text style={styles.saveButtonText}>Saving...</Text>
          ) : (
            <>
              <Icon name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
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
  memberHeader: {
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
  memberAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  memberRole: {
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 14,
    color: theme.colors.primary,
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 20,
  },
  presetsContainer: {
    gap: 12,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  presetItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  presetIcon: {
    marginRight: 16,
  },
  presetInfo: {
    flex: 1,
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  presetTitleSelected: {
    color: '#fff',
  },
  presetDesc: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  presetDescSelected: {
    color: '#fff',
    opacity: 0.9,
  },
  permissionsContainer: {
    gap: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  permissionItemDisabled: {
    opacity: 0.5,
  },
  permissionIcon: {
    marginRight: 16,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  permissionTitleDisabled: {
    color: theme.colors.outline,
  },
  permissionDesc: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  permissionDescDisabled: {
    color: theme.colors.outline,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  resetButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});