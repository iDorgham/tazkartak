import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/config/theme';

// Import organizer screens
import { OrganizerDashboardScreen } from '@/screens/organizer/OrganizerDashboardScreen';
import { CreateEventScreen } from '@/screens/organizer/CreateEventScreen';
import { EditEventScreen } from '@/screens/organizer/EditEventScreen';
import { MyEventsScreen } from '@/screens/organizer/MyEventsScreen';
import { EventAnalyticsScreen } from '@/screens/organizer/EventAnalyticsScreen';
import { TicketTypesScreen } from '@/screens/organizer/TicketTypesScreen';
import { AttendeesListScreen } from '@/screens/organizer/AttendeesListScreen';
import { CheckInScreen } from '@/screens/organizer/CheckInScreen';
import { SalesReportScreen } from '@/screens/organizer/SalesReportScreen';
import { SubscriptionScreen } from '@/screens/organizer/SubscriptionScreen';

export type OrganizerStackParamList = {
  // Dashboard & Overview
  OrganizerDashboard: undefined;
  
  // Event Management
  CreateEvent: undefined;
  EditEvent: { eventId: string };
  MyEvents: undefined;
  EventAnalytics: { eventId: string };
  
  // Ticket Management
  TicketTypes: { eventId: string };
  AttendeesList: { eventId: string };
  CheckIn: { eventId: string };
  SalesReport: { eventId: string };
  
  // Subscription
  Subscription: undefined;
};

const Stack = createStackNavigator<OrganizerStackParamList>();

export const OrganizerNavigator: React.FC = () => {
  return (
    <>
      {/* Dashboard Tab */}
      <Stack.Screen 
        name="OrganizerDashboard" 
        component={OrganizerDashboardScreen}
        options={{
          title: 'Dashboard',
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
      
      {/* Event Management */}
      <Stack.Screen 
        name="CreateEvent" 
        component={CreateEventScreen}
        options={{
          title: 'Create Event',
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
        name="EditEvent" 
        component={EditEventScreen}
        options={{
          title: 'Edit Event',
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
        name="MyEvents" 
        component={MyEventsScreen}
        options={{
          title: 'My Events',
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
        name="EventAnalytics" 
        component={EventAnalyticsScreen}
        options={{
          title: 'Event Analytics',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      {/* Ticket Management */}
      <Stack.Screen 
        name="TicketTypes" 
        component={TicketTypesScreen}
        options={{
          title: 'Ticket Types',
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
        name="AttendeesList" 
        component={AttendeesListScreen}
        options={{
          title: 'Attendees',
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
        name="CheckIn" 
        component={CheckInScreen}
        options={{
          title: 'Check-In',
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
        name="SalesReport" 
        component={SalesReportScreen}
        options={{
          title: 'Sales Report',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      {/* Subscription */}
      <Stack.Screen 
        name="Subscription" 
        component={SubscriptionScreen}
        options={{
          title: 'Subscription',
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
