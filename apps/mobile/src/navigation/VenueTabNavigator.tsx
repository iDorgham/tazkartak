import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { VenueDashboardScreen } from '@/screens/venue/VenueDashboardScreen';
import { MyVenuesScreen } from '@/screens/venue/MyVenuesScreen';
import { QRScannerScreen } from '@/screens/venue/QRScannerScreen';
import { ProfileScreen } from '@/screens/buyer/ProfileScreen';

import { theme } from '@/config/theme';

export type VenueTabParamList = {
  Dashboard: undefined;
  MyVenues: undefined;
  Scanner: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<VenueTabParamList>();

export const VenueTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'MyVenues':
              iconName = focused ? 'business' : 'business-outline';
              break;
            case 'Scanner':
              iconName = focused ? 'qr-code' : 'qr-code-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurface,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
          marginTop: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={VenueDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="MyVenues" 
        component={MyVenuesScreen}
        options={{
          tabBarLabel: 'My Venues',
        }}
      />
      <Tab.Screen 
        name="Scanner" 
        component={QRScannerScreen}
        options={{
          tabBarLabel: 'Scanner',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

