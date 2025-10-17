import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';

interface CardDetails {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  holderName: string;
}

interface CardPaymentFormProps {
  amount: number;
  currency: string;
  onPaymentSubmit: (cardDetails: CardDetails) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const CardPaymentForm: React.FC<CardPaymentFormProps> = ({
  amount,
  currency,
  onPaymentSubmit,
  onCancel,
  loading = false,
}) => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    holderName: '',
  });

  const [errors, setErrors] = useState<Partial<CardDetails>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CardDetails> = {};

    // Validate card number
    const cardNumber = cardDetails.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!/^\d{13,19}$/.test(cardNumber)) {
      newErrors.cardNumber = 'Please enter a valid card number';
    } else if (!isValidCardNumber(cardNumber)) {
      newErrors.cardNumber = 'Invalid card number';
    }

    // Validate expiry month
    const month = parseInt(cardDetails.expiryMonth);
    if (!cardDetails.expiryMonth) {
      newErrors.expiryMonth = 'Month is required';
    } else if (month < 1 || month > 12) {
      newErrors.expiryMonth = 'Invalid month';
    }

    // Validate expiry year
    const year = parseInt(cardDetails.expiryYear);
    const currentYear = new Date().getFullYear() % 100;
    if (!cardDetails.expiryYear) {
      newErrors.expiryYear = 'Year is required';
    } else if (year < currentYear) {
      newErrors.expiryYear = 'Card has expired';
    } else if (year > currentYear + 20) {
      newErrors.expiryYear = 'Invalid year';
    }

    // Validate CVV
    if (!cardDetails.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
      newErrors.cvv = 'Invalid CVV';
    }

    // Validate holder name
    if (!cardDetails.holderName.trim()) {
      newErrors.holderName = 'Cardholder name is required';
    } else if (cardDetails.holderName.trim().length < 2) {
      newErrors.holderName = 'Please enter full name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidCardNumber = (cardNumber: string): boolean => {
    // Luhn algorithm validation
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  const formatCardNumber = (text: string): string => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    return formatted;
  };

  const getCardType = (cardNumber: string): string => {
    const number = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6/.test(number)) return 'discover';
    
    return 'unknown';
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onPaymentSubmit(cardDetails);
    }
  };

  const cardType = getCardType(cardDetails.cardNumber);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Card Payment</Text>
        <Text style={styles.subtitle}>Enter your card details to complete the payment</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount:</Text>
          <Text style={styles.amountValue}>{currency} {amount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.form}>
        {/* Card Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Card Number</Text>
          <View style={styles.cardNumberContainer}>
            <TextInput
              style={[styles.input, errors.cardNumber && styles.inputError]}
              value={cardDetails.cardNumber}
              onChangeText={(text) => setCardDetails(prev => ({ 
                ...prev, 
                cardNumber: formatCardNumber(text).slice(0, 19) 
              }))}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              keyboardType="numeric"
              maxLength={19}
            />
            {cardType !== 'unknown' && (
              <View style={styles.cardTypeIcon}>
                <Icon 
                  name={cardType === 'visa' ? 'credit-card' : 
                        cardType === 'mastercard' ? 'credit-card' : 
                        cardType === 'amex' ? 'credit-card' : 'credit-card'} 
                  size={20} 
                  color={theme.colors.primary} 
                />
              </View>
            )}
          </View>
          {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}
        </View>

        {/* Expiry Date */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.inputLabel}>Month</Text>
            <TextInput
              style={[styles.input, errors.expiryMonth && styles.inputError]}
              value={cardDetails.expiryMonth}
              onChangeText={(text) => {
                const month = text.replace(/\D/g, '').slice(0, 2);
                setCardDetails(prev => ({ ...prev, expiryMonth: month }));
              }}
              placeholder="MM"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              keyboardType="numeric"
              maxLength={2}
            />
            {errors.expiryMonth && <Text style={styles.errorText}>{errors.expiryMonth}</Text>}
          </View>

          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.inputLabel}>Year</Text>
            <TextInput
              style={[styles.input, errors.expiryYear && styles.inputError]}
              value={cardDetails.expiryYear}
              onChangeText={(text) => {
                const year = text.replace(/\D/g, '').slice(0, 2);
                setCardDetails(prev => ({ ...prev, expiryYear: year }));
              }}
              placeholder="YY"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              keyboardType="numeric"
              maxLength={2}
            />
            {errors.expiryYear && <Text style={styles.errorText}>{errors.expiryYear}</Text>}
          </View>

          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.inputLabel}>CVV</Text>
            <TextInput
              style={[styles.input, errors.cvv && styles.inputError]}
              value={cardDetails.cvv}
              onChangeText={(text) => {
                const cvv = text.replace(/\D/g, '').slice(0, 4);
                setCardDetails(prev => ({ ...prev, cvv }));
              }}
              placeholder="123"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
            {errors.cvv && <Text style={styles.errorText}>{errors.cvv}</Text>}
          </View>
        </View>

        {/* Cardholder Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Cardholder Name</Text>
          <TextInput
            style={[styles.input, errors.holderName && styles.inputError]}
            value={cardDetails.holderName}
            onChangeText={(text) => setCardDetails(prev => ({ ...prev, holderName: text }))}
            placeholder="John Doe"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {errors.holderName && <Text style={styles.errorText}>{errors.holderName}</Text>}
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Icon name="security" size={20} color={theme.colors.success} />
          <Text style={styles.securityText}>
            Your payment information is encrypted and secure
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={loading}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.submitButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Pay {currency} {amount.toFixed(2)}</Text>
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surface,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  cardNumberContainer: {
    position: 'relative',
  },
  cardTypeIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  flex1: {
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginTop: 4,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  securityText: {
    fontSize: 14,
    color: theme.colors.success,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
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
  submitButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.outline,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

