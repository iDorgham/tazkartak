import { Platform } from 'react-native';
import { storageService } from './storage.service';
import { offlineService } from './offline.service';
import { notificationService } from './notification.service';
import { biometricService } from './biometric.service';

/**
 * Initialize all app services in the correct order
 */
export const initializeServices = async (): Promise<void> => {
  try {
    console.log('Initializing app services...');

    // 1. Initialize storage service first (required by other services)
    console.log('Initializing storage service...');
    await storageService.initialize();

    // 2. Initialize offline service
    console.log('Initializing offline service...');
    await offlineService.initialize();

    // 3. Initialize notification service
    console.log('Initializing notification service...');
    await notificationService.initialize();

    // 4. Initialize biometric service
    console.log('Initializing biometric service...');
    await biometricService.initialize();

    // 5. Initialize other services that might be needed
    await initializePlatformSpecificServices();

    // 6. Start background sync
    console.log('Starting background sync...');
    await offlineService.startBackgroundSync();

    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw error;
  }
};

/**
 * Initialize platform-specific services
 */
const initializePlatformSpecificServices = async (): Promise<void> => {
  if (Platform.OS === 'ios') {
    // iOS-specific initializations
    console.log('Initializing iOS-specific services...');
  } else if (Platform.OS === 'android') {
    // Android-specific initializations
    console.log('Initializing Android-specific services...');
  }
};

/**
 * Cleanup services when app is being destroyed
 */
export const cleanupServices = async (): Promise<void> => {
  try {
    console.log('Cleaning up services...');
    
    // Stop background sync
    await offlineService.stopBackgroundSync();
    
    // Cleanup notification service
    await notificationService.cleanup();
    
    console.log('Services cleaned up successfully');
  } catch (error) {
    console.error('Failed to cleanup services:', error);
  }
};
