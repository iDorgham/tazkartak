import { Platform, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { storageService } from './storage.service';
import { STORAGE_KEYS } from '@/utils/constants';

export interface BiometricType {
  type: 'fingerprint' | 'face' | 'iris' | 'none';
  available: boolean;
}

class BiometricService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // Check if biometrics are available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        console.log('Biometric hardware not available');
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        console.log('No biometric authentication enrolled');
        return;
      }

      this.isInitialized = true;
      console.log('Biometric service initialized');
    } catch (error) {
      console.error('Failed to initialize biometric service:', error);
    }
  }

  async getAvailableBiometricTypes(): Promise<BiometricType[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const biometricTypes: BiometricType[] = [];

      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricTypes.push({
          type: 'fingerprint',
          available: true,
        });
      }

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricTypes.push({
          type: 'face',
          available: true,
        });
      }

      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricTypes.push({
          type: 'iris',
          available: true,
        });
      }

      return biometricTypes;
    } catch (error) {
      console.error('Failed to get biometric types:', error);
      return [];
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await storageService.getBiometricEnabled();
      return enabled && this.isInitialized;
    } catch (error) {
      console.error('Failed to check biometric status:', error);
      return false;
    }
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await storageService.setBiometricEnabled(enabled);
    } catch (error) {
      console.error('Failed to set biometric status:', error);
      throw error;
    }
  }

  async authenticate(reason: string = 'Authenticate to continue'): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        console.log('Biometric service not initialized');
        return false;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        console.log('Biometric hardware not available');
        return false;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        console.log('No biometric authentication enrolled');
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  async authenticateWithPrompt(customPrompt?: string): Promise<boolean> {
    const prompt = customPrompt || 'Use biometric authentication to continue';
    return this.authenticate(prompt);
  }

  async canAuthenticate(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return false;

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) return false;

      return true;
    } catch (error) {
      console.error('Failed to check authentication capability:', error);
      return false;
    }
  }

  async getBiometricInfo(): Promise<{
    available: boolean;
    enrolled: boolean;
    types: BiometricType[];
  }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await this.getAvailableBiometricTypes();

      return {
        available: hasHardware,
        enrolled: isEnrolled,
        types,
      };
    } catch (error) {
      console.error('Failed to get biometric info:', error);
      return {
        available: false,
        enrolled: false,
        types: [],
      };
    }
  }

  async setupBiometricAuth(): Promise<boolean> {
    try {
      const canAuth = await this.canAuthenticate();
      if (!canAuth) {
        Alert.alert(
          'Biometric Authentication Not Available',
          'Please set up biometric authentication in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const success = await this.authenticateWithPrompt(
        'Set up biometric authentication for quick access'
      );

      if (success) {
        await this.setBiometricEnabled(true);
        Alert.alert(
          'Biometric Authentication Enabled',
          'You can now use biometric authentication to quickly access the app.',
          [{ text: 'OK' }]
        );
      }

      return success;
    } catch (error) {
      console.error('Failed to setup biometric auth:', error);
      Alert.alert(
        'Setup Failed',
        'Failed to set up biometric authentication. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  async disableBiometricAuth(): Promise<void> {
    try {
      await this.setBiometricEnabled(false);
      Alert.alert(
        'Biometric Authentication Disabled',
        'Biometric authentication has been disabled. You will need to use your password to access the app.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to disable biometric auth:', error);
      throw error;
    }
  }

  async quickAuthenticate(): Promise<boolean> {
    try {
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return false;
      }

      return await this.authenticate('Quick access');
    } catch (error) {
      console.error('Quick authentication failed:', error);
      return false;
    }
  }
}

export const biometricService = new BiometricService();
