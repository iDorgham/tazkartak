import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { PaymentGateway, PaymentMethod } from '@/types/payment.types';
import { paymentService } from '@/services/payment.service';

interface PaymentMethodOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  gateway: PaymentGateway;
  method: PaymentMethod;
  available: boolean;
  fees?: {
    percentage?: number;
    fixed?: number;
  };
}

interface PaymentMethodSelectorProps {
  amount: number;
  currency: string;
  onMethodSelected: (option: PaymentMethodOption) => void;
  onCancel: () => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  amount,
  currency,
  onMethodSelected,
  onCancel,
}) => {
  const [availableMethods, setAvailableMethods] = useState<PaymentMethodOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailablePaymentMethods();
  }, []);

  const loadAvailablePaymentMethods = async () => {
    try {
      setLoading(true);

      // Define all possible payment methods
      const allMethods: PaymentMethodOption[] = [
        // PayMob Methods
        {
          id: 'paymob_card',
          name: 'Credit/Debit Card',
          description: 'Pay with Visa, Mastercard, or other major cards',
          icon: 'credit-card',
          gateway: PaymentGateway.PAYMOB,
          method: PaymentMethod.CREDIT_CARD,
          available: paymentService.isGatewaySupported(PaymentGateway.PAYMOB),
          fees: { percentage: 2.5 },
        },
        {
          id: 'paymob_wallet',
          name: 'Digital Wallet',
          description: 'Pay with your digital wallet',
          icon: 'account-balance-wallet',
          gateway: PaymentGateway.PAYMOB,
          method: PaymentMethod.WALLET,
          available: paymentService.isGatewaySupported(PaymentGateway.PAYMOB),
          fees: { percentage: 2.0 },
        },
        {
          id: 'paymob_kiosk',
          name: 'Pay at Kiosk',
          description: 'Pay at any PayMob kiosk location',
          icon: 'store',
          gateway: PaymentGateway.PAYMOB,
          method: PaymentMethod.CASH_ON_DELIVERY,
          available: paymentService.isGatewaySupported(PaymentGateway.PAYMOB),
          fees: { fixed: 5 },
        },

        // Fawry Methods
        {
          id: 'fawry_card',
          name: 'Fawry Card',
          description: 'Pay with Fawry payment card',
          icon: 'credit-card',
          gateway: PaymentGateway.FAWRY,
          method: PaymentMethod.CREDIT_CARD,
          available: paymentService.isGatewaySupported(PaymentGateway.FAWRY),
          fees: { percentage: 3.0 },
        },
        {
          id: 'fawry_wallet',
          name: 'Fawry Wallet',
          description: 'Pay with your Fawry wallet',
          icon: 'account-balance-wallet',
          gateway: PaymentGateway.FAWRY,
          method: PaymentMethod.WALLET,
          available: paymentService.isGatewaySupported(PaymentGateway.FAWRY),
          fees: { percentage: 2.5 },
        },
        {
          id: 'fawry_plus',
          name: 'Fawry Plus',
          description: 'Pay with Fawry Plus',
          icon: 'add-circle',
          gateway: PaymentGateway.FAWRY,
          method: PaymentMethod.WALLET,
          available: paymentService.isGatewaySupported(PaymentGateway.FAWRY),
          fees: { percentage: 2.5 },
        },
        {
          id: 'fawry_cash',
          name: 'Cash Collection',
          description: 'Pay cash at Fawry locations',
          icon: 'local-atm',
          gateway: PaymentGateway.FAWRY,
          method: PaymentMethod.CASH_ON_DELIVERY,
          available: paymentService.isGatewaySupported(PaymentGateway.FAWRY),
          fees: { fixed: 3 },
        },

        // WebView Fallback
        {
          id: 'webview_fallback',
          name: 'Online Payment',
          description: 'Complete payment in your browser',
          icon: 'web',
          gateway: PaymentGateway.PAYMOB, // Default to PayMob for WebView
          method: PaymentMethod.CREDIT_CARD,
          available: true, // WebView is always available
          fees: { percentage: 2.5 },
        },
      ];

      // Filter available methods
      const available = allMethods.filter(method => method.available);
      setAvailableMethods(available);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      Alert.alert('Error', 'Failed to load payment methods. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalWithFees = (method: PaymentMethodOption): number => {
    let total = amount;
    
    if (method.fees?.percentage) {
      total += (amount * method.fees.percentage) / 100;
    }
    
    if (method.fees?.fixed) {
      total += method.fees.fixed;
    }
    
    return total;
  };

  const handleMethodSelect = (method: PaymentMethodOption) => {
    const totalWithFees = calculateTotalWithFees(method);
    
    if (method.fees?.percentage || method.fees?.fixed) {
      Alert.alert(
        'Payment Fees',
        `This payment method includes additional fees.\n\nOriginal amount: ${currency} ${amount.toFixed(2)}\nTotal with fees: ${currency} ${totalWithFees.toFixed(2)}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Continue',
            onPress: () => onMethodSelected(method),
          },
        ]
      );
    } else {
      onMethodSelected(method);
    }
  };

  const renderPaymentMethod = (method: PaymentMethodOption) => {
    const totalWithFees = calculateTotalWithFees(method);
    const hasFees = method.fees?.percentage || method.fees?.fixed;

    return (
      <TouchableOpacity
        key={method.id}
        style={styles.methodCard}
        onPress={() => handleMethodSelect(method)}
      >
        <View style={styles.methodHeader}>
          <View style={styles.methodIcon}>
            <Icon name={method.icon} size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>{method.name}</Text>
            <Text style={styles.methodDescription}>{method.description}</Text>
          </View>
          <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
        </View>
        
        {hasFees && (
          <View style={styles.feeInfo}>
            <Text style={styles.feeText}>
              Total: {currency} {totalWithFees.toFixed(2)}
              {method.fees?.percentage && ` (includes ${method.fees.percentage}% fee)`}
              {method.fees?.fixed && ` (includes ${currency} ${method.fees.fixed} fee)`}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderGatewaySection = (gateway: PaymentGateway) => {
    const gatewayMethods = availableMethods.filter(method => method.gateway === gateway);
    
    if (gatewayMethods.length === 0) return null;

    const gatewayName = gateway === PaymentGateway.PAYMOB ? 'PayMob' : 
                       gateway === PaymentGateway.FAWRY ? 'Fawry' : 'Other';

    return (
      <View key={gateway} style={styles.gatewaySection}>
        <Text style={styles.gatewayTitle}>{gatewayName} Payment Methods</Text>
        {gatewayMethods.map(renderPaymentMethod)}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Payment Method</Text>
          <Text style={styles.subtitle}>Choose how you'd like to pay</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading payment methods...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Payment Method</Text>
        <Text style={styles.subtitle}>Choose how you'd like to pay</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount to pay:</Text>
          <Text style={styles.amountValue}>{currency} {amount.toFixed(2)}</Text>
        </View>
      </View>

      <ScrollView style={styles.methodsContainer} showsVerticalScrollIndicator={false}>
        {Object.values(PaymentGateway).map(renderGatewaySection)}
        
        {availableMethods.length === 0 && (
          <View style={styles.noMethodsContainer}>
            <Icon name="payment" size={48} color={theme.colors.outline} />
            <Text style={styles.noMethodsTitle}>No Payment Methods Available</Text>
            <Text style={styles.noMethodsDescription}>
              Please check your internet connection and try again.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadAvailablePaymentMethods}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    padding: 16,
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  methodsContainer: {
    flex: 1,
    padding: 16,
  },
  gatewaySection: {
    marginBottom: 24,
  },
  gatewayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  methodCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  feeInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  feeText: {
    fontSize: 14,
    color: theme.colors.warning,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  noMethodsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noMethodsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  noMethodsDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  cancelButton: {
    backgroundColor: theme.colors.surfaceVariant,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
});

