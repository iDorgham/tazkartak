import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { theme } from '@/config/theme';
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector';
import { CardPaymentForm } from '@/components/payment/CardPaymentForm';
import { WebViewPayment } from '@/components/payment/WebViewPayment';
import { paymentService } from '@/services/payment.service';
import { 
  CreatePaymentInput, 
  PaymentGateway, 
  PaymentMethod,
  PaymentResponse,
  PaymentCallback
} from '@/types/payment.types';

type PaymentProcessingScreenNavigationProp = StackNavigationProp<any, 'PaymentProcessing'>;
type PaymentProcessingScreenRouteProp = RouteProp<any, 'PaymentProcessing'>;

interface PaymentProcessingScreenProps {
  navigation: PaymentProcessingScreenNavigationProp;
  route: PaymentProcessingScreenRouteProp;
}

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

export const PaymentProcessingScreen: React.FC<PaymentProcessingScreenProps> = () => {
  const navigation = useNavigation<PaymentProcessingScreenNavigationProp>();
  const route = useRoute<PaymentProcessingScreenRouteProp>();
  
  const [currentStep, setCurrentStep] = useState<'method' | 'card' | 'webview' | 'processing'>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);

  // Get payment data from route params
  const paymentInput: CreatePaymentInput = route.params?.paymentInput;

  useEffect(() => {
    if (!paymentInput) {
      Alert.alert('Error', 'Payment information is missing', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }

    // Handle Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentStep === 'method') {
        navigation.goBack();
        return true;
      } else if (currentStep === 'card' || currentStep === 'webview') {
        setCurrentStep('method');
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [currentStep, navigation, paymentInput]);

  const handleMethodSelected = (method: PaymentMethodOption) => {
    setSelectedMethod(method);
    
    if (method.method === PaymentMethod.CREDIT_CARD || method.method === PaymentMethod.DEBIT_CARD) {
      setCurrentStep('card');
    } else {
      // For wallet, kiosk, or other methods, proceed directly to processing
      processPayment(method);
    }
  };

  const handleCardPayment = (cardDetails: any) => {
    if (selectedMethod) {
      processPayment(selectedMethod, cardDetails);
    }
  };

  const processPayment = async (method: PaymentMethodOption, paymentDetails?: any) => {
    try {
      setLoading(true);
      setCurrentStep('processing');

      // Create payment intent
      const paymentResponse = await paymentService.createPayment(paymentInput);
      
      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || 'Payment creation failed');
      }

      setPaymentData(paymentResponse);

      // Process payment based on method
      if (method.method === PaymentMethod.CREDIT_CARD || method.method === PaymentMethod.DEBIT_CARD) {
        // Process card payment
        const processResponse = await paymentService.processPayment(
          paymentResponse.payment!.id,
          method.method,
          paymentDetails
        );
        
        setPaymentResult(processResponse);
        
        if (processResponse.success) {
          handlePaymentSuccess(processResponse);
        } else {
          handlePaymentFailure(processResponse.error || 'Payment failed');
        }
      } else if (method.method === PaymentMethod.WALLET) {
        // Process wallet payment
        const processResponse = await paymentService.processPayment(
          paymentResponse.payment!.id,
          method.method,
          paymentDetails
        );
        
        setPaymentResult(processResponse);
        
        if (processResponse.success) {
          handlePaymentSuccess(processResponse);
        } else {
          handlePaymentFailure(processResponse.error || 'Wallet payment failed');
        }
      } else {
        // For other methods (kiosk, cash collection), show WebView
        setCurrentStep('webview');
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
      handlePaymentFailure(error instanceof Error ? error.message : 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewPaymentSuccess = (webViewData: any) => {
    setPaymentResult({
      success: true,
      payment: webViewData.payment,
    });
    handlePaymentSuccess({
      success: true,
      payment: webViewData.payment,
    });
  };

  const handleWebViewPaymentFailure = (error: string) => {
    setPaymentResult({
      success: false,
      error,
    });
    handlePaymentFailure(error);
  };

  const handlePaymentSuccess = (response: PaymentResponse) => {
    Alert.alert(
      'Payment Successful',
      'Your payment has been processed successfully. You will receive a confirmation email shortly.',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('PurchaseConfirmation', {
              payment: response.payment,
              orderId: paymentInput.orderId,
            });
          },
        },
      ]
    );
  };

  const handlePaymentFailure = (error: string) => {
    Alert.alert(
      'Payment Failed',
      error,
      [
        {
          text: 'Try Again',
          onPress: () => setCurrentStep('method'),
        },
        {
          text: 'Cancel',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleCancel = () => {
    if (currentStep === 'method') {
      navigation.goBack();
    } else {
      setCurrentStep('method');
    }
  };

  const handleWebViewCancel = () => {
    setCurrentStep('method');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'method':
        return (
          <PaymentMethodSelector
            amount={paymentInput.amount}
            currency={paymentInput.currency}
            onMethodSelected={handleMethodSelected}
            onCancel={handleCancel}
          />
        );

      case 'card':
        return (
          <CardPaymentForm
            amount={paymentInput.amount}
            currency={paymentInput.currency}
            onPaymentSubmit={handleCardPayment}
            onCancel={handleCancel}
            loading={loading}
          />
        );

      case 'webview':
        return (
          <WebViewPayment
            paymentUrl={paymentData?.redirectUrl || ''}
            paymentId={paymentData?.payment?.id || ''}
            onPaymentSuccess={handleWebViewPaymentSuccess}
            onPaymentFailure={handleWebViewPaymentFailure}
            onPaymentCancel={handleWebViewCancel}
          />
        );

      case 'processing':
        return (
          <View style={styles.processingContainer}>
            <Text style={styles.processingTitle}>Processing Payment</Text>
            <Text style={styles.processingSubtitle}>Please wait while we process your payment...</Text>
            <View style={styles.spinner} />
          </View>
        );

      default:
        return null;
    }
  };

  if (!paymentInput) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Payment information is missing</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderCurrentStep()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
    textAlign: 'center',
  },
  processingSubtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 32,
  },
  spinner: {
    width: 40,
    height: 40,
    borderWidth: 4,
    borderColor: theme.colors.surfaceVariant,
    borderTopColor: theme.colors.primary,
    borderRadius: 20,
    // Add animation here if needed
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.error,
    textAlign: 'center',
  },
});

