import React from 'react';
import { useSelector } from 'react-redux';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

import { RootState } from '@/store';
import { UserRole } from '@/types/auth.types';
import { theme } from '@/config/theme';

// Import navigators for different user roles
import { BuyerNavigator } from './BuyerNavigator';
import { OrganizerNavigator } from './OrganizerNavigator';
import { VenueNavigator } from './VenueNavigator';
import { AdminNavigator } from './AdminNavigator';

// Import shared screens
import { ProfileScreen } from '@/screens/shared/ProfileScreen';
import { SettingsScreen } from '@/screens/shared/SettingsScreen';
import { NotificationsScreen } from '@/screens/shared/NotificationsScreen';

export type MainTabParamList = {
  Home: undefined;
  Events: undefined;
  Tickets: undefined;
  Profile: undefined;
};

export type MainDrawerParamList = {
  MainTabs: undefined;
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator<MainDrawerParamList>();

const MainTabNavigator: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const getTabBarIcon = (routeName: string, focused: boolean, color: string, size: number) => {
    let iconName: keyof typeof Ionicons.glyphMap;

    switch (routeName) {
      case 'Home':
        iconName = focused ? 'home' : 'home-outline';
        break;
      case 'Events':
        iconName = focused ? 'calendar' : 'calendar-outline';
        break;
      case 'Tickets':
        iconName = focused ? 'ticket' : 'ticket-outline';
        break;
      case 'Profile':
        iconName = focused ? 'person' : 'person-outline';
        break;
      default:
        iconName = 'help-outline';
    }

    return <Ionicons name={iconName} size={size} color={color} />;
  };

  // Determine which navigator to show based on user role
  const getRoleBasedNavigator = () => {
    switch (user?.role) {
      case UserRole.ORGANIZER:
        return <OrganizerNavigator />;
      case UserRole.VENUE_OWNER:
        return <VenueNavigator />;
      case UserRole.ADMIN:
        return <AdminNavigator />;
      case UserRole.TICKET_BUYER:
      default:
        return <BuyerNavigator />;
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) =>
          getTabBarIcon(route.name, focused, color, size),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurface,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      {getRoleBasedNavigator()}
    </Tab.Navigator>
  );
};

export const MainNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 280,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.onSurface,
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
        options={{
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          drawerLabel: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          drawerLabel: 'Notifications',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};