import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import DeviceInfo from 'react-native-device-info';
import { apiService } from './api.service';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/utils/constants';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
  BiometricCredentials,
} from '@/types/auth.types';

class AuthService {
  private rnBiometrics: ReactNativeBiometrics;

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      const response = await apiService.post(API_ENDPOINTS.AUTH.LOGIN, {
        ...credentials,
        deviceInfo,
      });

      const { user, tokens } = response.data.data;
      
      // Store tokens securely
      await this.storeTokens(tokens);
      await this.storeUserData(user);

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      const response = await apiService.post(API_ENDPOINTS.AUTH.REGISTER, {
        ...userData,
        deviceInfo,
      });

      const { user, tokens } = response.data.data;
      
      // Store tokens securely
      await this.storeTokens(tokens);
      await this.storeUserData(user);

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with local logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear all stored data
      await this.clearStoredData();
    }
  }

  async refreshToken(): Promise<RefreshTokenResponse> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
        refreshToken,
      });

      const { token, refreshToken: newRefreshToken } = response.data.data;
      
      // Update stored tokens
      await this.storeTokens({ accessToken: token, refreshToken: newRefreshToken });

      return { token, refreshToken: newRefreshToken };
    } catch (error) {
      // If refresh fails, clear stored data
      await this.clearStoredData();
      throw error;
    }
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
  }

  async verifyEmail(token: string): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
  }

  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    const response = await apiService.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, profileData);
    const user = response.data.data;
    
    // Update stored user data
    await this.storeUserData(user);
    
    return user;
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  }

  // Biometric authentication methods
  async enableBiometric(): Promise<void> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
      
      if (!available) {
        throw new Error('Biometric authentication is not available on this device');
      }

      // Check if biometrics are already enrolled
      const { available: enrolled } = await this.rnBiometrics.biometricKeysExist();
      
      if (!enrolled) {
        // Create new biometric keys
        const { publicKey } = await this.rnBiometrics.createKeys();
        
        // Store the public key securely
        await this.storeBiometricPublicKey(publicKey);
      }

      // Store biometric credentials
      const credentials = await this.getStoredCredentials();
      if (credentials) {
        await this.rnBiometrics.createSignature({
          promptMessage: 'Enable biometric authentication',
          payload: credentials.email,
        });

        await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
      }
    } catch (error) {
      throw new Error(`Failed to enable biometric authentication: ${error.message}`);
    }
  }

  async disableBiometric(): Promise<void> {
    try {
      await this.rnBiometrics.deleteKeys();
      await AsyncStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      await Keychain.resetInternetCredentials('biometric_credentials');
    } catch (error) {
      throw new Error(`Failed to disable biometric authentication: ${error.message}`);
    }
  }

  async loginWithBiometric(): Promise<AuthResponse> {
    try {
      const { available } = await this.rnBiometrics.isSensorAvailable();
      
      if (!available) {
        throw new Error('Biometric authentication is not available');
      }

      const { available: enrolled } = await this.rnBiometrics.biometricKeysExist();
      
      if (!enrolled) {
        throw new Error('Biometric authentication is not set up');
      }

      // Get stored credentials
      const credentials = await this.getStoredCredentials();
      if (!credentials) {
        throw new Error('No stored credentials found');
      }

      // Verify biometric signature
      const { success, signature } = await this.rnBiometrics.createSignature({
        promptMessage: 'Authenticate with biometric',
        payload: credentials.email,
      });

      if (!success || !signature) {
        throw new Error('Biometric authentication failed');
      }

      // Login with stored credentials
      return await this.login(credentials);
    } catch (error) {
      throw new Error(`Biometric login failed: ${error.message}`);
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
      const { available: enrolled } = await this.rnBiometrics.biometricKeysExist();
      
      return enabled === 'true' && available && enrolled;
    } catch (error) {
      return false;
    }
  }

  async getBiometricType(): Promise<string | null> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
      
      if (!available) {
        return null;
      }

      switch (biometryType) {
        case BiometryTypes.TouchID:
          return 'TouchID';
        case BiometryTypes.FaceID:
          return 'FaceID';
        case BiometryTypes.Biometrics:
          return 'Fingerprint';
        default:
          return 'Biometric';
      }
    } catch (error) {
      return null;
    }
  }

  // Token management
  private async storeTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken),
      AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
    ]);
  }

  private async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  private async storeUserData(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  private async getStoredCredentials(): Promise<BiometricCredentials | null> {
    try {
      const credentials = await Keychain.getInternetCredentials('biometric_credentials');
      
      if (credentials && credentials.username && credentials.password) {
        return {
          username: credentials.username,
          password: credentials.password,
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private async storeBiometricPublicKey(publicKey: string): Promise<void> {
    await Keychain.setInternetCredentials(
      'biometric_public_key',
      'public_key',
      publicKey
    );
  }

  private async clearStoredData(): Promise<void> {
    await Promise.all([
      AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]),
      Keychain.resetInternetCredentials('biometric_credentials'),
      Keychain.resetInternetCredentials('biometric_public_key'),
    ]);
  }

  private async getDeviceInfo(): Promise<any> {
    try {
      return {
        deviceId: await DeviceInfo.getUniqueId(),
        deviceName: await DeviceInfo.getDeviceName(),
        platform: DeviceInfo.getSystemName(),
        version: DeviceInfo.getSystemVersion(),
        appVersion: await DeviceInfo.getVersion(),
        buildNumber: await DeviceInfo.getBuildNumber(),
        isEmulator: await DeviceInfo.isEmulator(),
        brand: DeviceInfo.getBrand(),
        model: DeviceInfo.getModel(),
      };
    } catch (error) {
      return {
        deviceId: 'unknown',
        deviceName: 'Unknown Device',
        platform: 'unknown',
        version: 'unknown',
        appVersion: '1.0.0',
        buildNumber: '1',
        isEmulator: false,
      };
    }
  }

  // Session management
  async updateLastActivity(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({
      ...await this.getStoredUserData(),
      lastActivity: new Date().toISOString(),
    }));
  }

  private async getStoredUserData(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  // Security methods
  async clearSession(): Promise<void> {
    await this.clearStoredData();
  }

  async isSessionValid(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await this.getStoredUserData();
      
      return !!(token && userData);
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();
