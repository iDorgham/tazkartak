import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { Provider, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import SplashScreen from 'react-native-splash-screen';

import { store, persistor } from '@/store';
import { RootNavigator } from '@/navigation/RootNavigator';
import { toastConfig } from '@/config/toast.config';
import { theme } from '@/config/theme';
import { initializeOfflineService } from '@/store/offline.slice';
import { OfflineIndicator } from '@/components/common/OfflineIndicator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const AppContent: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize offline services
    dispatch(initializeOfflineService());
    
    // Hide splash screen after app is ready
    if (Platform.OS === 'android') {
      SplashScreen.hide();
    }
  }, [dispatch]);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      <RootNavigator />
      <OfflineIndicator />
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <AppContent />
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
