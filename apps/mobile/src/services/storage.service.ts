import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { STORAGE_KEYS } from '@/utils/constants';

interface StorageItem<T = any> {
  value: T;
  timestamp: number;
}

class StorageService {
  // Secure storage methods (using Keychain)
  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(key, key, value);
    } catch (error) {
      console.error(`Failed to store secure item ${key}:`, error);
      throw error;
    }
  }

  async getSecureItem(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(key);
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error(`Failed to retrieve secure item ${key}:`, error);
      return null;
    }
  }

  async removeSecureItem(key: string): Promise<void> {
    try {
      await Keychain.resetInternetCredentials(key);
    } catch (error) {
      console.error(`Failed to remove secure item ${key}:`, error);
    }
  }

  // Regular storage methods (using AsyncStorage)
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error(`Failed to store item ${key}:`, error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const itemData = await AsyncStorage.getItem(key);
      if (!itemData) return null;
      
      const item: StorageItem<T> = JSON.parse(itemData);
      return item.value;
    } catch (error) {
      console.error(`Failed to retrieve item ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
    }
  }

  async multiGet(keys: string[]): Promise<Array<[string, any]>> {
    try {
      const items = await AsyncStorage.multiGet(keys);
      return items.map(([key, value]) => [key, value ? JSON.parse(value) : null]);
    } catch (error) {
      console.error('Failed to get multiple items:', error);
      return [];
    }
  }

  async multiSet(items: Array<[string, any]>): Promise<void> {
    try {
      const serializedItems: Array<[string, string]> = items.map(([key, value]) => [
        key,
        JSON.stringify({
          value,
          timestamp: Date.now(),
        }),
      ]);
      await AsyncStorage.multiSet(serializedItems);
    } catch (error) {
      console.error('Failed to set multiple items:', error);
      throw error;
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Failed to remove multiple items:', error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  // Utility methods
  async getStorageSize(): Promise<number> {
    try {
      const keys = await this.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
      return 0;
    }
  }

  async isItemExpired(key: string, maxAge: number): Promise<boolean> {
    try {
      const itemData = await AsyncStorage.getItem(key);
      if (!itemData) return true;
      
      const item: StorageItem = JSON.parse(itemData);
      return Date.now() - item.timestamp > maxAge;
    } catch (error) {
      console.error(`Failed to check expiration for ${key}:`, error);
      return true;
    }
  }

  // Specific storage methods for app data
  async setAuthToken(token: string): Promise<void> {
    await this.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async getAuthToken(): Promise<string | null> {
    return await this.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async removeAuthToken(): Promise<void> {
    await this.removeSecureItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async setRefreshToken(token: string): Promise<void> {
    await this.setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return await this.getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async removeRefreshToken(): Promise<void> {
    await this.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async setUserData(userData: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_DATA, userData);
  }

  async getUserData(): Promise<any> {
    return await this.getItem(STORAGE_KEYS.USER_DATA);
  }

  async removeUserData(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER_DATA);
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await this.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled);
  }

  async getBiometricEnabled(): Promise<boolean> {
    const enabled = await this.getItem<boolean>(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return enabled ?? false;
  }

  async setThemeMode(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.setItem(STORAGE_KEYS.THEME_MODE, theme);
  }

  async getThemeMode(): Promise<'light' | 'dark' | 'system'> {
    const theme = await this.getItem<'light' | 'dark' | 'system'>(STORAGE_KEYS.THEME_MODE);
    return theme ?? 'system';
  }

  async setLanguage(language: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.LANGUAGE, language);
  }

  async getLanguage(): Promise<string> {
    const language = await this.getItem<string>(STORAGE_KEYS.LANGUAGE);
    return language ?? 'en';
  }

  async setOnboardingCompleted(completed: boolean): Promise<void> {
    await this.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
  }

  async getOnboardingCompleted(): Promise<boolean> {
    const completed = await this.getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return completed ?? false;
  }

  async setNotificationPermissions(permissions: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.NOTIFICATION_PERMISSIONS, permissions);
  }

  async getNotificationPermissions(): Promise<any> {
    return await this.getItem(STORAGE_KEYS.NOTIFICATION_PERMISSIONS);
  }

  async setCachedEvents(events: any[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.CACHED_EVENTS, events);
  }

  async getCachedEvents(): Promise<any[]> {
    const events = await this.getItem<any[]>(STORAGE_KEYS.CACHED_EVENTS);
    return events ?? [];
  }

  async setCachedTickets(tickets: any[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.CACHED_TICKETS, tickets);
  }

  async getCachedTickets(): Promise<any[]> {
    const tickets = await this.getItem<any[]>(STORAGE_KEYS.CACHED_TICKETS);
    return tickets ?? [];
  }

  async setOfflineQueue(queue: any[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  }

  async getOfflineQueue(): Promise<any[]> {
    const queue = await this.getItem<any[]>(STORAGE_KEYS.OFFLINE_QUEUE);
    return queue ?? [];
  }

  async setLastSync(timestamp: number): Promise<void> {
    await this.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
  }

  async getLastSync(): Promise<number> {
    const timestamp = await this.getItem<number>(STORAGE_KEYS.LAST_SYNC);
    return timestamp ?? 0;
  }

  // Cleanup methods
  async clearAuthData(): Promise<void> {
    await this.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
  }

  async clearCacheData(): Promise<void> {
    await this.multiRemove([
      STORAGE_KEYS.CACHED_EVENTS,
      STORAGE_KEYS.CACHED_TICKETS,
      STORAGE_KEYS.OFFLINE_QUEUE,
    ]);
  }

  async clearUserPreferences(): Promise<void> {
    await this.multiRemove([
      STORAGE_KEYS.THEME_MODE,
      STORAGE_KEYS.LANGUAGE,
      STORAGE_KEYS.NOTIFICATION_PERMISSIONS,
    ]);
  }
}

export const storageService = new StorageService();
