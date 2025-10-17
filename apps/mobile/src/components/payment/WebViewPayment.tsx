import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';

import { theme } from '@/config/theme';
import { webviewPaymentService } from '@/services/webview-payment.service';
import { paymentService } from '@/services/payment.service';

interface WebViewPaymentProps {
  paymentUrl: string;
  paymentId: string;
  headers?: Record<string, string>;
  postData?: string;
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentFailure: (error: string) => void;
  onPaymentCancel: () => void;
}

export const WebViewPayment: React.FC<WebViewPaymentProps> = ({
  paymentUrl,
  paymentId,
  headers = {},
  postData,
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentCancel,
}) => {
  const navigation = useNavigation();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Handle Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [canGoBack]);

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    
    // Check if navigation is to a success/cancel/failure URL
    const url = navState.url.toLowerCase();
    
    if (url.includes('success') || url.includes('approved') || url.includes('completed')) {
      handlePaymentSuccess(navState.url);
    } else if (url.includes('cancel') || url.includes('cancelled')) {
      handlePaymentCancel();
    } else if (url.includes('failure') || url.includes('failed') || url.includes('error')) {
      handlePaymentFailure('Payment failed');
    }
  };

  const handlePaymentSuccess = async (callbackUrl: string) => {
    try {
      setLoading(true);
      
      // Parse callback URL to extract payment data
      const callbackData = webviewPaymentService.parseCallbackUrl(callbackUrl);
      
      // Handle payment callback
      const callbackResult = await webviewPaymentService.handlePaymentCallback(
        paymentId,
        callbackUrl,
        callbackData
      );

      if (callbackResult.success) {
        onPaymentSuccess(callbackResult.data);
      } else {
        onPaymentFailure(callbackResult.error || 'Payment callback failed');
      }
    } catch (error) {
      console.error('Payment success handling failed:', error);
      onPaymentFailure(error instanceof Error ? error.message : 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    Alert.alert(
      'Payment Cancelled',
      'You have cancelled the payment process.',
      [
        {
          text: 'OK',
          onPress: () => {
            onPaymentCancel();
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
          text: 'OK',
          onPress: () => {
            onPaymentFailure(error);
          },
        },
      ]
    );
  };

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    
    Alert.alert(
      'Payment Error',
      'An error occurred while loading the payment page. Please check your internet connection and try again.',
      [
        {
          text: 'Retry',
          onPress: () => {
            if (webViewRef.current) {
              webViewRef.current.reload();
            }
          },
        },
        {
          text: 'Cancel',
          onPress: () => {
            onPaymentCancel();
          },
        },
      ]
    );
  };

  const handleWebViewLoadStart = () => {
    setLoading(true);
  };

  const handleWebViewLoadEnd = () => {
    setLoading(false);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'payment_success':
          handlePaymentSuccess(message.url);
          break;
        case 'payment_failure':
          handlePaymentFailure(message.error);
          break;
        case 'payment_cancel':
          handlePaymentCancel();
          break;
        default:
          console.log('Unknown message from WebView:', message);
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
    }
  };

  const injectedJavaScript = `
    // Override console.log to capture payment-related logs
    const originalLog = console.log;
    console.log = function(...args) {
      originalLog.apply(console, args);
      
      // Send payment-related logs to React Native
      const message = args.join(' ');
      if (message.includes('payment') || message.includes('success') || message.includes('error')) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          message: message
        }));
      }
    };

    // Monitor URL changes for payment callbacks
    let currentUrl = window.location.href;
    const checkUrl = () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        
        // Check for payment callback URLs
        if (currentUrl.includes('success') || currentUrl.includes('approved')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_success',
            url: currentUrl
          }));
        } else if (currentUrl.includes('cancel') || currentUrl.includes('cancelled')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_cancel',
            url: currentUrl
          }));
        } else if (currentUrl.includes('failure') || currentUrl.includes('error')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_failure',
            error: 'Payment failed',
            url: currentUrl
          }));
        }
      }
    };

    // Check URL every 500ms
    setInterval(checkUrl, 500);

    // Also listen for popstate events
    window.addEventListener('popstate', checkUrl);

    true; // Required for injected JavaScript
  `;

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{
          uri: paymentUrl,
          headers,
          ...(postData && { body: postData, method: 'POST' }),
        }}
        style={styles.webView}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleWebViewError}
        onLoadStart={handleWebViewLoadStart}
        onLoadEnd={handleWebViewLoadEnd}
        onMessage={handleWebViewMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        // Security settings
        allowsFullscreenVideo={false}
        allowsProtectedMedia={false}
        // Performance settings
        cacheEnabled={true}
        incognito={false}
        // User agent for better compatibility
        userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 TazkartakApp/1.0.0"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
});

