import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

import { RootState } from '@/store';
import { UserRole } from '@/types/auth.types';
import { logout } from '@/store/auth.slice';
import { theme } from '@/config/theme';

interface DrawerItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: number;
}

const DrawerItem: React.FC<DrawerItemProps> = ({ icon, label, onPress, badge }) => (
  <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
    <Ionicons name={icon} size={24} color={theme.colors.onSurface} />
    <Text style={styles.drawerItemLabel}>{label}</Text>
    {badge && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
  </TouchableOpacity>
);

export const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { unreadNotifications } = useSelector((state: RootState) => state.ui);

  const handleLogout = () => {
    dispatch(logout());
    props.navigation.closeDrawer();
  };

  const handleNavigate = (screen: string) => {
    props.navigation.navigate(screen as any);
    props.navigation.closeDrawer();
  };

  const getRoleSpecificItems = () => {
    if (!user) return [];

    switch (user.role) {
      case UserRole.ADMIN:
        return [
          { icon: 'people' as const, label: 'User Management', screen: 'UserManagement' },
          { icon: 'checkmark-circle' as const, label: 'Venue Verification', screen: 'VenueVerification' },
          { icon: 'checkmark-circle' as const, label: 'Organizer Verification', screen: 'OrganizerVerification' },
          { icon: 'bar-chart' as const, label: 'Reports', screen: 'Reports' },
          { icon: 'settings' as const, label: 'System Settings', screen: 'SystemSettings' },
        ];
      case UserRole.ORGANIZER:
        return [
          { icon: 'add-circle' as const, label: 'Create Event', screen: 'CreateEvent' },
          { icon: 'analytics' as const, label: 'Event Analytics', screen: 'EventAnalytics' },
          { icon: 'card' as const, label: 'Subscription', screen: 'Subscription' },
        ];
      case UserRole.VENUE_OWNER:
        return [
          { icon: 'add-circle' as const, label: 'Add Venue', screen: 'CreateVenue' },
          { icon: 'qr-code' as const, label: 'QR Scanner', screen: 'QRScanner' },
          { icon: 'people' as const, label: 'Team Management', screen: 'TeamManagement' },
        ];
      default:
        return [];
    }
  };

  const commonItems = [
    { icon: 'notifications' as const, label: 'Notifications', screen: 'Notifications', badge: unreadNotifications },
    { icon: 'settings' as const, label: 'Settings', screen: 'Settings' },
    { icon: 'help-circle' as const, label: 'Support', screen: 'Support' },
    { icon: 'information-circle' as const, label: 'About', screen: 'About' },
  ];

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={32} color={theme.colors.onPrimary} />
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.userRole}>
                {user?.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
          </View>
        </View>

        {/* Role-specific items */}
        {getRoleSpecificItems().map((item, index) => (
          <DrawerItem
            key={index}
            icon={item.icon}
            label={item.label}
            onPress={() => handleNavigate(item.screen)}
          />
        ))}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Common items */}
        {commonItems.map((item, index) => (
          <DrawerItem
            key={index}
            icon={item.icon}
            label={item.label}
            onPress={() => handleNavigate(item.screen)}
            badge={item.badge}
          />
        ))}

        {/* Logout */}
        <View style={styles.divider} />
        <DrawerItem
          icon="log-out"
          label="Logout"
          onPress={handleLogout}
        />
      </DrawerContentScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: theme.spacing.md,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primaryVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onPrimary,
    opacity: 0.8,
    marginBottom: 2,
  },
  userRole: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.onPrimary,
    opacity: 0.7,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  drawerItemLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.onSurface,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: theme.colors.onPrimary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.outline,
    marginVertical: theme.spacing.sm,
  },
});

