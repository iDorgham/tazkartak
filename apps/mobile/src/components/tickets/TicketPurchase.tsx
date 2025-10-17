import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Divider, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';
import { TicketType, Event } from '@/types/event.types';

interface TicketPurchaseProps {
  event: Event;
  ticketTypes: TicketType[];
  onPurchase: (ticketTypeId: string, quantity: number) => void;
  onClose?: () => void;
}

interface SelectedTicket {
  ticketTypeId: string;
  quantity: number;
  price: number;
}

export const TicketPurchase: React.FC<TicketPurchaseProps> = ({
  event,
  ticketTypes,
  onPurchase,
  onClose,
}) => {
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

  const updateTicketQuantity = (ticketTypeId: string, quantity: number) => {
    if (quantity < 0) return;

    setSelectedTickets(prev => {
      const existing = prev.find(t => t.ticketTypeId === ticketTypeId);
      if (existing) {
        if (quantity === 0) {
          return prev.filter(t => t.ticketTypeId !== ticketTypeId);
        }
        return prev.map(t =>
          t.ticketTypeId === ticketTypeId
            ? { ...t, quantity, price: t.price * quantity }
            : t
        );
      } else if (quantity > 0) {
        const ticketType = ticketTypes.find(t => t.id === ticketTypeId);
        if (ticketType) {
          return [...prev, {
            ticketTypeId,
            quantity,
            price: ticketType.price * quantity,
          }];
        }
      }
      return prev;
    });
  };

  const getTicketQuantity = (ticketTypeId: string): number => {
    const selected = selectedTickets.find(t => t.ticketTypeId === ticketTypeId);
    return selected ? selected.quantity : 0;
  };

  const getTotalPrice = (): number => {
    return selectedTickets.reduce((total, ticket) => total + ticket.price, 0);
  };

  const getTotalQuantity = (): number => {
    return selectedTickets.reduce((total, ticket) => total + ticket.quantity, 0);
  };

  const handlePurchase = async () => {
    if (selectedTickets.length === 0) {
      Alert.alert('No Tickets Selected', 'Please select at least one ticket to purchase.');
      return;
    }

    setIsLoading(true);
    try {
      // Process each selected ticket type
      for (const ticket of selectedTickets) {
        await onPurchase(ticket.ticketTypeId, ticket.quantity);
      }
      
      Alert.alert(
        'Purchase Successful',
        'Your tickets have been purchased successfully!',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Purchase Failed', 'There was an error processing your purchase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(price);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Event Info */}
        <Card style={styles.eventCard}>
          <Card.Content>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventDate}>{formatDate(event.startDate)}</Text>
            <Text style={styles.eventLocation}>{event.venue?.name}</Text>
            <Text style={styles.eventAddress}>{event.venue?.address}</Text>
          </Card.Content>
        </Card>

        {/* Ticket Types */}
        <View style={styles.ticketTypesContainer}>
          <Text style={styles.sectionTitle}>Select Tickets</Text>
          
          {ticketTypes.map((ticketType) => (
            <Card key={ticketType.id} style={styles.ticketTypeCard}>
              <Card.Content>
                <View style={styles.ticketTypeHeader}>
                  <Text style={styles.ticketTypeName}>{ticketType.name}</Text>
                  <Text style={styles.ticketTypePrice}>
                    {formatPrice(ticketType.price)}
                  </Text>
                </View>
                
                {ticketType.description && (
                  <Text style={styles.ticketTypeDescription}>
                    {ticketType.description}
                  </Text>
                )}

                <View style={styles.ticketTypeFooter}>
                  <Text style={styles.availableTickets}>
                    {ticketType.availableQuantity} available
                  </Text>
                  
                  <View style={styles.quantityControls}>
                    <Button
                      mode="outlined"
                      onPress={() => updateTicketQuantity(ticketType.id, getTicketQuantity(ticketType.id) - 1)}
                      disabled={getTicketQuantity(ticketType.id) === 0}
                      compact
                    >
                      -
                    </Button>
                    
                    <Text style={styles.quantityText}>
                      {getTicketQuantity(ticketType.id)}
                    </Text>
                    
                    <Button
                      mode="outlined"
                      onPress={() => updateTicketQuantity(ticketType.id, getTicketQuantity(ticketType.id) + 1)}
                      disabled={getTicketQuantity(ticketType.id) >= ticketType.availableQuantity}
                      compact
                    >
                      +
                    </Button>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Order Summary */}
        {selectedTickets.length > 0 && (
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              
              {selectedTickets.map((ticket) => {
                const ticketType = ticketTypes.find(t => t.id === ticket.ticketTypeId);
                return (
                  <View key={ticket.ticketTypeId} style={styles.summaryRow}>
                    <Text style={styles.summaryText}>
                      {ticketType?.name} x {ticket.quantity}
                    </Text>
                    <Text style={styles.summaryPrice}>
                      {formatPrice(ticket.price)}
                    </Text>
                  </View>
                );
              })}
              
              <Divider style={styles.divider} />
              
              <View style={styles.totalRow}>
                <Text style={styles.totalText}>Total</Text>
                <Text style={styles.totalPrice}>
                  {formatPrice(getTotalPrice())}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Purchase Button */}
      {selectedTickets.length > 0 && (
        <View style={styles.purchaseContainer}>
          <Button
            mode="contained"
            onPress={handlePurchase}
            loading={isLoading}
            disabled={isLoading}
            style={styles.purchaseButton}
            icon="shopping-cart"
          >
            Purchase {getTotalQuantity()} Ticket{getTotalQuantity() !== 1 ? 's' : ''} - {formatPrice(getTotalPrice())}
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.md,
  },
  eventCard: {
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  eventTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
  },
  eventDate: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  eventLocation: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  eventAddress: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  ticketTypesContainer: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md,
  },
  ticketTypeCard: {
    marginBottom: theme.spacing.md,
    elevation: 1,
  },
  ticketTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  ticketTypeName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.onSurface,
    flex: 1,
  },
  ticketTypePrice: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  ticketTypeDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
    opacity: 0.8,
    marginBottom: theme.spacing.sm,
  },
  ticketTypeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availableTickets: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.onSurface,
    opacity: 0.6,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  quantityText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.onSurface,
    minWidth: 30,
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  summaryText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.onSurface,
    flex: 1,
  },
  summaryPrice: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.onSurface,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  divider: {
    marginVertical: theme.spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onSurface,
  },
  totalPrice: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  purchaseContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  purchaseButton: {
    paddingVertical: theme.spacing.sm,
  },
});
