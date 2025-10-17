import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';

// Import admin screens
import { AdminDashboardScreen } from '@/screens/admin/AdminDashboardScreen';
import { UserManagementScreen } from '@/screens/admin/UserManagementScreen';
import { UserDetailsScreen } from '@/screens/admin/UserDetailsScreen';
import { VerificationQueueScreen } from '@/screens/admin/VerificationQueueScreen';
import { EventModerationScreen } from '@/screens/admin/EventModerationScreen';
import { VenueVerificationScreen } from '@/screens/admin/VenueVerificationScreen';
import { SystemAnalyticsScreen } from '@/screens/admin/SystemAnalyticsScreen';
import { SystemSettingsScreen } from '@/screens/admin/SystemSettingsScreen';
import { PaymentSettingsScreen } from '@/screens/admin/PaymentSettingsScreen';
import { NotificationCenterScreen } from '@/screens/admin/NotificationCenterScreen';
import { AuditLogScreen } from '@/screens/admin/AuditLogScreen';
import { SupportTicketsScreen } from '@/screens/admin/SupportTicketsScreen';

export type AdminStackParamList = {
  // Dashboard
  AdminDashboard: undefined;
  
  // User Management
  UserManagement: undefined;
  UserDetails: { userId: string };
  
  // Verification & Moderation
  VerificationQueue: undefined;
  EventModeration: undefined;
  VenueVerification: undefined;
  
  // Analytics & Settings
  SystemAnalytics: undefined;
  SystemSettings: undefined;
  PaymentSettings: undefined;
  NotificationCenter: undefined;
  
  // System Management
  AuditLog: undefined;
  SupportTickets: undefined;
};

const Stack = createStackNavigator<AdminStackParamList>();

export const AdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Dashboard */}
      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{
          title: 'Admin Dashboard',
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16 }}
              onPress={() => {/* Navigate to settings */}}
            >
              <Icon name="settings" size={24} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      {/* User Management */}
      <Stack.Screen 
        name="UserManagement" 
        component={UserManagementScreen}
        options={{
          title: 'User Management',
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16 }}
              onPress={() => {/* Navigate to create user */}}
            >
              <Icon name="person-add" size={24} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <Stack.Screen 
        name="UserDetails" 
        component={UserDetailsScreen}
        options={{
          title: 'User Details',
        }}
      />
      
      {/* Verification & Moderation */}
      <Stack.Screen 
        name="VerificationQueue" 
        component={VerificationQueueScreen}
        options={{
          title: 'Verification Queue',
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16 }}
              onPress={() => {/* Navigate to bulk actions */}}
            >
              <Icon name="checklist" size={24} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <Stack.Screen 
        name="EventModeration" 
        component={EventModerationScreen}
        options={{
          title: 'Event Moderation',
        }}
      />
      
      <Stack.Screen 
        name="VenueVerification" 
        component={VenueVerificationScreen}
        options={{
          title: 'Venue Verification',
        }}
      />
      
      {/* Analytics & Settings */}
      <Stack.Screen 
        name="SystemAnalytics" 
        component={SystemAnalyticsScreen}
        options={{
          title: 'System Analytics',
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16 }}
              onPress={() => {/* Navigate to export */}}
            >
              <Icon name="download" size={24} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <Stack.Screen 
        name="SystemSettings" 
        component={SystemSettingsScreen}
        options={{
          title: 'System Settings',
        }}
      />
      
      <Stack.Screen 
        name="PaymentSettings" 
        component={PaymentSettingsScreen}
        options={{
          title: 'Payment Settings',
        }}
      />
      
      <Stack.Screen 
        name="NotificationCenter" 
        component={NotificationCenterScreen}
        options={{
          title: 'Notification Center',
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16 }}
              onPress={() => {/* Navigate to send notification */}}
            >
              <Icon name="send" size={24} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      {/* System Management */}
      <Stack.Screen 
        name="AuditLog" 
        component={AuditLogScreen}
        options={{
          title: 'Audit Log',
        }}
      />
      
      <Stack.Screen 
        name="SupportTickets" 
        component={SupportTicketsScreen}
        options={{
          title: 'Support Tickets',
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16 }}
              onPress={() => {/* Navigate to create ticket */}}
            >
              <Icon name="add" size={24} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack.Navigator>
  );
};