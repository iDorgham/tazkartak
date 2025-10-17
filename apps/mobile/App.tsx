import React, { useEffect, useState, Suspense } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import { store, persistor } from './src/store';
import { theme } from './src/config/theme';
import { LoadingScreen } from './src/components/common/LoadingScreen';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { performanceService } from './src/services/performance.service';
import { analyticsService } from './src/services/analytics.service';
import { crashReportingService } from './src/services/crash-reporting.service';
import { sslPinningService } from './src/services/ssl-pinning.service';
import { secureStorageService } from './src/services/secure-storage.service';
import { securityService } from './src/services/security.service';
import { twoFactorAuthService } from './src/services/two-factor-auth.service';

// Lazy load heavy components
const RootNavigator = React.lazy(() => import('./src/navigation/RootNavigator'));
const initializeServices = () => import('./src/services/initialization');

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize crash reporting first (critical for error tracking)
        await crashReportingService.initialize();
        
        // Initialize security services
        await secureStorageService.initialize();
        await securityService.initialize();
        await sslPinningService.initialize();
        await twoFactorAuthService.initialize();
        
        // Initialize analytics service
        await analyticsService.initialize();
        
        // Initialize performance monitoring
        await performanceService.initialize();
        
        // Initialize other services asynchronously
        initializeServices().catch(error => {
          console.error('Failed to initialize services:', error);
          crashReportingService.captureException(error as Error, {
            context: 'service_initialization',
          });
        });
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        crashReportingService.captureException(error as Error, {
          context: 'app_initialization',
        });
        // Continue anyway - app can work with limited functionality
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      const prepare = async () => {
        try {
          // Pre-load fonts, make any API calls you need to do here
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          console.warn(e);
        } finally {
          setIsReady(true);
          // Hide the splash screen
          await SplashScreen.hideAsync();
        }
      };

      prepare();
    }
  }, [isInitialized]);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              <PaperProvider theme={theme}>
                      <NavigationContainer>
                        <StatusBar
                          barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
                          backgroundColor={theme.colors.primary}
                        />
                        <Suspense fallback={<LoadingScreen />}>
                          <RootNavigator />
                        </Suspense>
                      </NavigationContainer>
              </PaperProvider>
            </QueryClientProvider>
          </PersistGate>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default App;