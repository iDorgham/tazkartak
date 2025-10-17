import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { crashReportingService } from './crash-reporting.service';
import { analyticsService } from './analytics.service';

interface SecureStorageConfig {
  keyPrefix: string;
  encryptionKey: string;
  enableBiometricAuth: boolean;
  maxRetries: number;
  timeoutMs: number;
}

interface EncryptedData {
  data: string;
  iv: string;
  timestamp: number;
  version: string;
}

interface BiometricPrompt {
  title: string;
  subtitle?: string;
  description?: string;
  negativeButtonText?: string;
}

class SecureStorageService {
  private config: SecureStorageConfig;
  private isInitialized = false;
  private encryptionKey: string;
  private readonly STORAGE_VERSION = '1.0.0';
  private readonly KEY_PREFIX = 'secure_';

  constructor() {
    this.config = {
      keyPrefix: this.KEY_PREFIX,
      encryptionKey: '', // Will be generated during initialization
      enableBiometricAuth: true,
      maxRetries: 3,
      timeoutMs: 30000, // 30 seconds
    };
  }

  async initialize(): Promise<void> {
    try {
      // Generate or retrieve encryption key
      await this.initializeEncryptionKey();
      
      this.isInitialized = true;
      console.log('Secure storage service initialized');
      
      // Track initialization
      await analyticsService.trackEvent('secure_storage_initialized', {
        platform: Platform.OS,
        biometricAuthEnabled: this.config.enableBiometricAuth,
      });
    } catch (error) {
      console.error('Failed to initialize secure storage service:', error);
      crashReportingService.captureException(error as Error, {
        context: 'secure_storage_initialization',
      });
      throw error;
    }
  }

  private async initializeEncryptionKey(): Promise<void> {
    try {
      // Try to retrieve existing encryption key
      const existingKey = await AsyncStorage.getItem(`${this.config.keyPrefix}encryption_key`);
      
      if (existingKey) {
        this.encryptionKey = existingKey;
        this.config.encryptionKey = existingKey;
      } else {
        // Generate new encryption key
        this.encryptionKey = await this.generateEncryptionKey();
        this.config.encryptionKey = this.encryptionKey;
        
        // Store the key securely
        await AsyncStorage.setItem(`${this.config.keyPrefix}encryption_key`, this.encryptionKey);
      }
    } catch (error) {
      console.error('Failed to initialize encryption key:', error);
      throw new Error('Failed to initialize encryption key');
    }
  }

  private async generateEncryptionKey(): Promise<string> {
    try {
      // Generate a secure random key
      const randomBytes = Crypto.getRandomBytes(32);
      return Crypto.toHex(randomBytes);
    } catch (error) {
      console.error('Failed to generate encryption key:', error);
      // Fallback to a deterministic key (not recommended for production)
      return Crypto.digestString(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `tazkartak_secure_key_${Date.now()}_${Math.random()}`,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
    }
  }

  // Store sensitive data with encryption
  async setItem(key: string, value: any, requireBiometric: boolean = false): Promise<void> {
    try {
      if (!this.isInitialized) {
        throw new Error('Secure storage service not initialized');
      }

      // Check if biometric authentication is required and available
      if (requireBiometric && this.config.enableBiometricAuth) {
        const biometricAvailable = await this.checkBiometricAvailability();
        if (!biometricAvailable) {
          throw new Error('Biometric authentication not available');
        }
      }

      // Serialize the value
      const serializedValue = JSON.stringify(value);
      
      // Encrypt the data
      const encryptedData = await this.encryptData(serializedValue);
      
      // Store the encrypted data
      const storageKey = `${this.config.keyPrefix}${key}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(encryptedData));

      // Track successful storage
      await analyticsService.trackEvent('secure_storage_item_set', {
        key: key,
        requiresBiometric: requireBiometric,
        dataSize: serializedValue.length,
      });

      console.log(`Securely stored item: ${key}`);
    } catch (error) {
      console.error(`Failed to store secure item ${key}:`, error);
      crashReportingService.captureException(error as Error, {
        context: 'secure_storage_set_item',
        key,
        requireBiometric,
      });
      throw error;
    }
  }

  // Retrieve sensitive data with decryption
  async getItem<T = any>(key: string, requireBiometric: boolean = false): Promise<T | null> {
    try {
      if (!this.isInitialized) {
        throw new Error('Secure storage service not initialized');
      }

      // Check if biometric authentication is required
      if (requireBiometric && this.config.enableBiometricAuth) {
        const biometricAvailable = await this.checkBiometricAvailability();
        if (!biometricAvailable) {
          throw new Error('Biometric authentication not available');
        }

        // Prompt for biometric authentication
        const authenticated = await this.promptBiometricAuthentication({
          title: 'Authenticate to access secure data',
          subtitle: 'Use your biometric to continue',
        });

        if (!authenticated) {
          throw new Error('Biometric authentication failed');
        }
      }

      // Retrieve the encrypted data
      const storageKey = `${this.config.keyPrefix}${key}`;
      const encryptedDataString = await AsyncStorage.getItem(storageKey);
      
      if (!encryptedDataString) {
        return null;
      }

      // Parse the encrypted data
      const encryptedData: EncryptedData = JSON.parse(encryptedDataString);
      
      // Check version compatibility
      if (encryptedData.version !== this.STORAGE_VERSION) {
        console.warn(`Version mismatch for key ${key}: stored=${encryptedData.version}, current=${this.STORAGE_VERSION}`);
      }

      // Decrypt the data
      const decryptedData = await this.decryptData(encryptedData);
      
      // Deserialize and return
      const value = JSON.parse(decryptedData);

      // Track successful retrieval
      await analyticsService.trackEvent('secure_storage_item_get', {
        key: key,
        requiresBiometric: requireBiometric,
        dataSize: decryptedData.length,
      });

      console.log(`Securely retrieved item: ${key}`);
      return value;
    } catch (error) {
      console.error(`Failed to retrieve secure item ${key}:`, error);
      crashReportingService.captureException(error as Error, {
        context: 'secure_storage_get_item',
        key,
        requireBiometric,
      });
      throw error;
    }
  }

  // Remove sensitive data
  async removeItem(key: string): Promise<void> {
    try {
      const storageKey = `${this.config.keyPrefix}${key}`;
      await AsyncStorage.removeItem(storageKey);

      // Track removal
      await analyticsService.trackEvent('secure_storage_item_removed', {
        key: key,
      });

      console.log(`Securely removed item: ${key}`);
    } catch (error) {
      console.error(`Failed to remove secure item ${key}:`, error);
      crashReportingService.captureException(error as Error, {
        context: 'secure_storage_remove_item',
        key,
      });
      throw error;
    }
  }

  // Clear all secure storage
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(key => key.startsWith(this.config.keyPrefix));
      
      await AsyncStorage.multiRemove(secureKeys);

      // Track clearing
      await analyticsService.trackEvent('secure_storage_cleared', {
        itemsRemoved: secureKeys.length,
      });

      console.log(`Cleared ${secureKeys.length} secure storage items`);
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
      crashReportingService.captureException(error as Error, {
        context: 'secure_storage_clear',
      });
      throw error;
    }
  }

  // Check if an item exists
  async hasItem(key: string): Promise<boolean> {
    try {
      const storageKey = `${this.config.keyPrefix}${key}`;
      const item = await AsyncStorage.getItem(storageKey);
      return item !== null;
    } catch (error) {
      console.error(`Failed to check if secure item exists ${key}:`, error);
      return false;
    }
  }

  // Get all secure storage keys
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter(key => key.startsWith(this.config.keyPrefix))
        .map(key => key.replace(this.config.keyPrefix, ''));
    } catch (error) {
      console.error('Failed to get secure storage keys:', error);
      return [];
    }
  }

  // Encrypt data using AES encryption
  private async encryptData(data: string): Promise<EncryptedData> {
    try {
      // Generate random IV
      const iv = Crypto.getRandomBytes(16);
      const ivHex = Crypto.toHex(iv);

      // Encrypt the data
      const encrypted = await Crypto.encrypt(
        this.encryptionKey,
        data,
        iv,
        {
          algorithm: Crypto.CryptoAlgorithm.AES,
          mode: Crypto.CryptoMode.CBC,
          padding: Crypto.CryptoPadding.PKCS7,
        }
      );

      return {
        data: encrypted,
        iv: ivHex,
        timestamp: Date.now(),
        version: this.STORAGE_VERSION,
      };
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      throw new Error('Encryption failed');
    }
  }

  // Decrypt data using AES decryption
  private async decryptData(encryptedData: EncryptedData): Promise<string> {
    try {
      // Convert IV from hex
      const iv = Crypto.fromHex(encryptedData.iv);

      // Decrypt the data
      const decrypted = await Crypto.decrypt(
        this.encryptionKey,
        encryptedData.data,
        iv,
        {
          algorithm: Crypto.CryptoAlgorithm.AES,
          mode: Crypto.CryptoMode.CBC,
          padding: Crypto.CryptoPadding.PKCS7,
        }
      );

      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      throw new Error('Decryption failed');
    }
  }

  // Check biometric availability
  private async checkBiometricAvailability(): Promise<boolean> {
    try {
      // In a real implementation, you would check if biometric authentication
      // is available on the device using libraries like:
      // - react-native-biometrics
      // - expo-local-authentication
      
      // For now, we'll simulate the check
      return true; // Placeholder
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
      return false;
    }
  }

  // Prompt for biometric authentication
  private async promptBiometricAuthentication(prompt: BiometricPrompt): Promise<boolean> {
    try {
      // In a real implementation, you would show the biometric prompt
      // using libraries like react-native-biometrics or expo-local-authentication
      
      // For now, we'll simulate the authentication
      return true; // Placeholder
    } catch (error) {
      console.error('Failed to prompt biometric authentication:', error);
      return false;
    }
  }

  // Rotate encryption key (for enhanced security)
  async rotateEncryptionKey(): Promise<void> {
    try {
      // Get all existing keys
      const keys = await this.getAllKeys();
      
      // Decrypt all data with old key
      const decryptedData: { [key: string]: any } = {};
      for (const key of keys) {
        try {
          decryptedData[key] = await this.getItem(key, false);
        } catch (error) {
          console.warn(`Failed to decrypt ${key} during key rotation:`, error);
        }
      }

      // Generate new encryption key
      const newKey = await this.generateEncryptionKey();
      
      // Update the encryption key
      this.encryptionKey = newKey;
      this.config.encryptionKey = newKey;

      // Store new key
      await AsyncStorage.setItem(`${this.config.keyPrefix}encryption_key`, newKey);

      // Re-encrypt all data with new key
      for (const [key, value] of Object.entries(decryptedData)) {
        try {
          await this.setItem(key, value, false);
        } catch (error) {
          console.warn(`Failed to re-encrypt ${key} during key rotation:`, error);
        }
      }

      // Track key rotation
      await analyticsService.trackEvent('secure_storage_key_rotated', {
        itemsRotated: Object.keys(decryptedData).length,
      });

      console.log('Encryption key rotated successfully');
    } catch (error) {
      console.error('Failed to rotate encryption key:', error);
      crashReportingService.captureException(error as Error, {
        context: 'secure_storage_key_rotation',
      });
      throw error;
    }
  }

  // Security audit
  async performSecurityAudit(): Promise<{
    totalItems: number;
    encryptedItems: number;
    biometricProtectedItems: number;
    recommendations: string[];
  }> {
    try {
      const keys = await this.getAllKeys();
      let encryptedItems = 0;
      let biometricProtectedItems = 0;
      const recommendations: string[] = [];

      // Check each item
      for (const key of keys) {
        try {
          const hasItem = await this.hasItem(key);
          if (hasItem) {
            encryptedItems++;
            // In a real implementation, you would check if the item requires biometric auth
            // For now, we'll estimate
            if (key.includes('token') || key.includes('password')) {
              biometricProtectedItems++;
            }
          }
        } catch (error) {
          console.warn(`Failed to audit item ${key}:`, error);
        }
      }

      // Generate recommendations
      if (encryptedItems < keys.length) {
        recommendations.push('Some items may not be properly encrypted');
      }

      if (biometricProtectedItems < encryptedItems * 0.5) {
        recommendations.push('Consider enabling biometric protection for more sensitive items');
      }

      if (encryptedItems === 0) {
        recommendations.push('No secure items found - consider storing sensitive data securely');
      }

      const audit = {
        totalItems: keys.length,
        encryptedItems,
        biometricProtectedItems,
        recommendations,
      };

      // Track security audit
      await analyticsService.trackEvent('secure_storage_security_audit', audit);

      return audit;
    } catch (error) {
      console.error('Failed to perform security audit:', error);
      return {
        totalItems: 0,
        encryptedItems: 0,
        biometricProtectedItems: 0,
        recommendations: ['Failed to perform security audit'],
      };
    }
  }

  // Get storage statistics
  getStats(): {
    isInitialized: boolean;
    config: SecureStorageConfig;
    version: string;
  } {
    return {
      isInitialized: this.isInitialized,
      config: { ...this.config, encryptionKey: '[HIDDEN]' },
      version: this.STORAGE_VERSION,
    };
  }

  // Cleanup
  destroy(): void {
    this.encryptionKey = '';
    this.config.encryptionKey = '';
    this.isInitialized = false;
    console.log('Secure storage service destroyed');
  }
}

export const secureStorageService = new SecureStorageService();
