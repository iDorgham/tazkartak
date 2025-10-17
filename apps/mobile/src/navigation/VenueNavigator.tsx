import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/config/theme';

// Import venue screens
import { VenueListScreen } from '@/screens/venue/VenueListScreen';
import { VenueDetailsScreen } from '@/screens/venue/VenueDetailsScreen';
import { CreateVenueScreen } from '@/screens/venue/CreateVenueScreen';
import { EditVenueScreen } from '@/screens/venue/EditVenueScreen';
import { QRScannerScreen } from '@/screens/venue/QRScannerScreen';
import { ScanHistoryScreen } from '@/screens/venue/ScanHistoryScreen';
import { EventCheckInScreen } from '@/screens/venue/EventCheckInScreen';
import { VenueTeamScreen } from '@/screens/venue/VenueTeamScreen';
import { TeamPermissionsScreen } from '@/screens/venue/TeamPermissionsScreen';

export type VenueStackParamList = {
  // Venue Management
  VenueList: undefined;
  VenueDetails: { venueId: string };
  CreateVenue: undefined;
  EditVenue: { venueId: string };
  
  // QR Scanning & Check-in
  QRScanner: { eventId?: string; venueId?: string };
  ScanHistory: { venueId?: string };
  EventCheckIn: { eventId: string; venueId: string };
  
  // Team Management
  VenueTeam: { venueId: string };
  TeamPermissions: { venueId: string; teamMemberId: string };
};

const Stack = createStackNavigator<VenueStackParamList>();

export const VenueNavigator: React.FC = () => {
  return (
    <>
      {/* Venue List Tab */}
      <Stack.Screen 
        name="VenueList" 
        component={VenueListScreen}
        options={{
          title: 'My Venues',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <Ionicons 
              name="add-circle" 
              size={24} 
              color={theme.colors.onPrimary} 
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />
      
      {/* Venue Management */}
      <Stack.Screen 
        name="VenueDetails" 
        component={VenueDetailsScreen}
        options={{
          title: 'Venue Details',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      <Stack.Screen 
        name="CreateVenue" 
        component={CreateVenueScreen}
        options={{
          title: 'Create Venue',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      <Stack.Screen 
        name="EditVenue" 
        component={EditVenueScreen}
        options={{
          title: 'Edit Venue',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      {/* QR Scanning & Check-in */}
      <Stack.Screen 
        name="QRScanner" 
        component={QRScannerScreen}
        options={{
          title: 'Scan QR Code',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => null, // Prevent going back during scanning
        }}
      />
      
      <Stack.Screen 
        name="ScanHistory" 
        component={ScanHistoryScreen}
        options={{
          title: 'Scan History',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      <Stack.Screen 
        name="EventCheckIn" 
        component={EventCheckInScreen}
        options={{
          title: 'Event Check-In',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      {/* Team Management */}
      <Stack.Screen 
        name="VenueTeam" 
        component={VenueTeamScreen}
        options={{
          title: 'Team Members',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      <Stack.Screen 
        name="TeamPermissions" 
        component={TeamPermissionsScreen}
        options={{
          title: 'Team Permissions',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </>
  );
};
