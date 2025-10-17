import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/config/theme';

// Import buyer screens
import { EventsListScreen } from '@/screens/buyer/EventsListScreen';
import { EventDetailsScreen } from '@/screens/buyer/EventDetailsScreen';
import { EventSearchScreen } from '@/screens/buyer/EventSearchScreen';
import { EventMapScreen } from '@/screens/buyer/EventMapScreen';
import { TicketSelectionScreen } from '@/screens/buyer/TicketSelectionScreen';
import { CheckoutScreen } from '@/screens/buyer/CheckoutScreen';
import { PaymentMethodScreen } from '@/screens/buyer/PaymentMethodScreen';
import { PaymentProcessingScreen } from '@/screens/buyer/PaymentProcessingScreen';
import { PurchaseConfirmationScreen } from '@/screens/buyer/PurchaseConfirmationScreen';
import { MyTicketsScreen } from '@/screens/buyer/MyTicketsScreen';
import { TicketDetailScreen } from '@/screens/buyer/TicketDetailScreen';
import { OrderHistoryScreen } from '@/screens/buyer/OrderHistoryScreen';

export type BuyerStackParamList = {
  // Events
  EventsList: undefined;
  EventDetails: { eventId: string };
  EventSearch: undefined;
  EventMap: undefined;
  
  // Ticket Purchase Flow
  TicketSelection: { eventId: string };
  Checkout: { eventId: string; selectedTickets: any[] };
  PaymentMethod: { eventId: string; selectedTickets: any[]; totalAmount: number };
  PaymentProcessing: { paymentId: string };
  PurchaseConfirmation: { orderId: string };
  
  // My Tickets
  MyTickets: undefined;
  TicketDetail: { ticketId: string };
  OrderHistory: undefined;
};

const Stack = createStackNavigator<BuyerStackParamList>();

export const BuyerNavigator: React.FC = () => {
  return (
    <>
      {/* Events Tab */}
      <Stack.Screen 
        name="EventsList" 
        component={EventsListScreen}
        options={{
          title: 'Events',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <Ionicons 
              name="search" 
              size={24} 
              color={theme.colors.onPrimary} 
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />
      
      <Stack.Screen 
        name="EventDetails" 
        component={EventDetailsScreen}
        options={{
          title: 'Event Details',
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
        name="EventSearch" 
        component={EventSearchScreen}
        options={{
          title: 'Search Events',
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
        name="EventMap" 
        component={EventMapScreen}
        options={{
          title: 'Events Map',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />

      {/* Ticket Purchase Flow */}
      <Stack.Screen 
        name="TicketSelection" 
        component={TicketSelectionScreen}
        options={{
          title: 'Select Tickets',
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
        name="Checkout" 
        component={CheckoutScreen}
        options={{
          title: 'Checkout',
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
        name="PaymentMethod" 
        component={PaymentMethodScreen}
        options={{
          title: 'Payment Method',
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
        name="PaymentProcessing" 
        component={PaymentProcessingScreen}
        options={{
          title: 'Processing Payment',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => null, // Prevent going back during payment
        }}
      />
      
      <Stack.Screen 
        name="PurchaseConfirmation" 
        component={PurchaseConfirmationScreen}
        options={{
          title: 'Purchase Successful',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => null, // Prevent going back
        }}
      />

      {/* My Tickets */}
      <Stack.Screen 
        name="MyTickets" 
        component={MyTicketsScreen}
        options={{
          title: 'My Tickets',
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
        name="TicketDetail" 
        component={TicketDetailScreen}
        options={{
          title: 'Ticket Details',
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
        name="OrderHistory" 
        component={OrderHistoryScreen}
        options={{
          title: 'Order History',
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
