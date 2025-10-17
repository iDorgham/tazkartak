import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetInfo } from '@react-native-community/netinfo';
import { storageService } from './storage.service';

export interface OfflineData {
  id: string;
  type: 'event' | 'ticket' | 'venue' | 'user' | 'payment';
  data: any;
  timestamp: number;
  version: number;
  synced: boolean;
  lastModified: number;
}

export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high';
}

export interface ConflictResolution {
  id: string;
  localData: any;
  remoteData: any;
  resolution: 'local' | 'remote' | 'merge' | 'manual';
  resolved: boolean;
  timestamp: number;
}

class OfflineStorageService {
  private static instance: OfflineStorageService;
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private syncQueue: SyncQueueItem[] = [];
  private isOnline = true;
  private syncInProgress = false;

  static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  constructor() {
    this.initializeNetworkListener();
    this.loadSyncQueue();
  }

  private async initializeNetworkListener(): Promise<void> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;

    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        console.log('Network reconnected, starting sync...');
        this.startSync();
      }
    });
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('sync_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  // Cache Management
  async cacheData(type: string, id: string, data: any, version: number = 1): Promise<void> {
    try {
      const cacheKey = `cache_${type}_${id}`;
      const offlineData: OfflineData = {
        id,
        type: type as any,
        data,
        timestamp: Date.now(),
        version,
        synced: false,
        lastModified: Date.now(),
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(offlineData));
      
      // Update cache index
      await this.updateCacheIndex(type, id, Date.now());
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  async getCachedData(type: string, id: string): Promise<any | null> {
    try {
      const cacheKey = `cache_${type}_${id}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }

      const offlineData: OfflineData = JSON.parse(cachedData);
      
      // Check if cache is expired
      if (Date.now() - offlineData.timestamp > this.cacheExpiry) {
        await this.removeCachedData(type, id);
        return null;
      }

      return offlineData.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  async removeCachedData(type: string, id: string): Promise<void> {
    try {
      const cacheKey = `cache_${type}_${id}`;
      await AsyncStorage.removeItem(cacheKey);
      await this.removeFromCacheIndex(type, id);
    } catch (error) {
      console.error('Failed to remove cached data:', error);
    }
  }

  async getAllCachedData(type: string): Promise<any[]> {
    try {
      const indexKey = `cache_index_${type}`;
      const indexData = await AsyncStorage.getItem(indexKey);
      
      if (!indexData) {
        return [];
      }

      const index = JSON.parse(indexData);
      const results: any[] = [];

      for (const item of index) {
        const cachedData = await this.getCachedData(type, item.id);
        if (cachedData) {
          results.push(cachedData);
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to get all cached data:', error);
      return [];
    }
  }

  private async updateCacheIndex(type: string, id: string, timestamp: number): Promise<void> {
    try {
      const indexKey = `cache_index_${type}`;
      let index = [];

      const existingIndex = await AsyncStorage.getItem(indexKey);
      if (existingIndex) {
        index = JSON.parse(existingIndex);
      }

      const existingItemIndex = index.findIndex((item: any) => item.id === id);
      if (existingItemIndex >= 0) {
        index[existingItemIndex].timestamp = timestamp;
      } else {
        index.push({ id, timestamp });
      }

      await AsyncStorage.setItem(indexKey, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to update cache index:', error);
    }
  }

  private async removeFromCacheIndex(type: string, id: string): Promise<void> {
    try {
      const indexKey = `cache_index_${type}`;
      const existingIndex = await AsyncStorage.getItem(indexKey);
      
      if (existingIndex) {
        const index = JSON.parse(existingIndex);
        const filteredIndex = index.filter((item: any) => item.id !== id);
        await AsyncStorage.setItem(indexKey, JSON.stringify(filteredIndex));
      }
    } catch (error) {
      console.error('Failed to remove from cache index:', error);
    }
  }

  // Sync Queue Management
  async addToSyncQueue(
    operation: 'create' | 'update' | 'delete',
    type: string,
    data: any,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    try {
      const queueItem: SyncQueueItem = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operation,
        type,
        data,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
        priority,
      };

      this.syncQueue.push(queueItem);
      await this.saveSyncQueue();

      // If online, try to sync immediately
      if (this.isOnline && !this.syncInProgress) {
        this.startSync();
      }
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  async removeFromSyncQueue(queueItemId: string): Promise<void> {
    try {
      this.syncQueue = this.syncQueue.filter(item => item.id !== queueItemId);
      await this.saveSyncQueue();
    } catch (error) {
      console.error('Failed to remove from sync queue:', error);
    }
  }

  getSyncQueue(): SyncQueueItem[] {
    return [...this.syncQueue];
  }

  getPendingSyncCount(): number {
    return this.syncQueue.length;
  }

  // Background Sync
  async startSync(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log('Starting background sync...');

    try {
      // Sort queue by priority (high -> medium -> low) and timestamp
      const sortedQueue = this.syncQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.timestamp - b.timestamp;
      });

      for (const item of sortedQueue) {
        try {
          await this.processSyncItem(item);
          await this.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error('Failed to sync item:', error);
          await this.handleSyncError(item, error);
        }
      }
    } catch (error) {
      console.error('Background sync failed:', error);
    } finally {
      this.syncInProgress = false;
      console.log('Background sync completed');
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    try {
      const { operation, type, data } = item;

      switch (operation) {
        case 'create':
          await this.syncCreate(type, data);
          break;
        case 'update':
          await this.syncUpdate(type, data);
          break;
        case 'delete':
          await this.syncDelete(type, data);
          break;
      }

      // Mark cached data as synced
      if (data.id) {
        await this.markDataAsSynced(type, data.id);
      }
    } catch (error) {
      throw error;
    }
  }

  private async syncCreate(type: string, data: any): Promise<void> {
    // Implementation depends on your API structure
    console.log(`Syncing create for ${type}:`, data);
    // Example: await apiService.post(`/${type}`, data);
  }

  private async syncUpdate(type: string, data: any): Promise<void> {
    console.log(`Syncing update for ${type}:`, data);
    // Example: await apiService.put(`/${type}/${data.id}`, data);
  }

  private async syncDelete(type: string, data: any): Promise<void> {
    console.log(`Syncing delete for ${type}:`, data);
    // Example: await apiService.delete(`/${type}/${data.id}`);
  }

  private async handleSyncError(item: SyncQueueItem, error: any): Promise<void> {
    item.retryCount++;
    
    if (item.retryCount >= item.maxRetries) {
      console.error('Max retries exceeded for sync item:', item);
      await this.removeFromSyncQueue(item.id);
      
      // Store failed sync for manual resolution
      await this.storeFailedSync(item, error);
    } else {
      // Add delay before retry
      const delay = Math.pow(2, item.retryCount) * 1000; // Exponential backoff
      setTimeout(() => {
        this.startSync();
      }, delay);
    }
  }

  private async storeFailedSync(item: SyncQueueItem, error: any): Promise<void> {
    try {
      const failedSyncs = await this.getFailedSyncs();
      failedSyncs.push({
        ...item,
        error: error.message || 'Unknown error',
        failedAt: Date.now(),
      });
      
      await AsyncStorage.setItem('failed_syncs', JSON.stringify(failedSyncs));
    } catch (error) {
      console.error('Failed to store failed sync:', error);
    }
  }

  async getFailedSyncs(): Promise<any[]> {
    try {
      const failedSyncs = await AsyncStorage.getItem('failed_syncs');
      return failedSyncs ? JSON.parse(failedSyncs) : [];
    } catch (error) {
      console.error('Failed to get failed syncs:', error);
      return [];
    }
  }

  // Conflict Resolution
  async detectConflict(type: string, id: string, remoteData: any): Promise<boolean> {
    try {
      const cachedData = await this.getCachedData(type, id);
      if (!cachedData) {
        return false;
      }

      const cacheKey = `cache_${type}_${id}`;
      const offlineData: OfflineData = JSON.parse(await AsyncStorage.getItem(cacheKey) || '{}');
      
      return offlineData.lastModified > remoteData.lastModified;
    } catch (error) {
      console.error('Failed to detect conflict:', error);
      return false;
    }
  }

  async resolveConflict(
    type: string,
    id: string,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<void> {
    try {
      const conflict: ConflictResolution = {
        id: `conflict_${type}_${id}`,
        localData: await this.getCachedData(type, id),
        remoteData: null, // This would come from API
        resolution,
        resolved: false,
        timestamp: Date.now(),
      };

      switch (resolution) {
        case 'local':
          // Keep local data, sync to server
          await this.addToSyncQueue('update', type, conflict.localData, 'high');
          break;
        case 'remote':
          // Use remote data, update cache
          await this.cacheData(type, id, conflict.remoteData, Date.now());
          break;
        case 'merge':
          // Merge data (implementation depends on data structure)
          const mergedData = this.mergeData(conflict.localData, conflict.remoteData);
          await this.cacheData(type, id, mergedData, Date.now());
          await this.addToSyncQueue('update', type, mergedData, 'high');
          break;
      }

      conflict.resolved = true;
      await this.storeConflictResolution(conflict);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  }

  private mergeData(localData: any, remoteData: any): any {
    // Simple merge strategy - in production, this should be more sophisticated
    return {
      ...remoteData,
      ...localData,
      lastModified: Date.now(),
    };
  }

  private async storeConflictResolution(conflict: ConflictResolution): Promise<void> {
    try {
      const conflicts = await this.getConflictResolutions();
      conflicts.push(conflict);
      await AsyncStorage.setItem('conflict_resolutions', JSON.stringify(conflicts));
    } catch (error) {
      console.error('Failed to store conflict resolution:', error);
    }
  }

  async getConflictResolutions(): Promise<ConflictResolution[]> {
    try {
      const conflicts = await AsyncStorage.getItem('conflict_resolutions');
      return conflicts ? JSON.parse(conflicts) : [];
    } catch (error) {
      console.error('Failed to get conflict resolutions:', error);
      return [];
    }
  }

  // Utility Methods
  async markDataAsSynced(type: string, id: string): Promise<void> {
    try {
      const cacheKey = `cache_${type}_${id}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const offlineData: OfflineData = JSON.parse(cachedData);
        offlineData.synced = true;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(offlineData));
      }
    } catch (error) {
      console.error('Failed to mark data as synced:', error);
    }
  }

  async clearExpiredCache(): Promise<void> {
    try {
      const now = Date.now();
      const types = ['event', 'ticket', 'venue', 'user', 'payment'];

      for (const type of types) {
        const indexKey = `cache_index_${type}`;
        const indexData = await AsyncStorage.getItem(indexKey);
        
        if (indexData) {
          const index = JSON.parse(indexData);
          const validItems = [];

          for (const item of index) {
            const cacheKey = `cache_${type}_${item.id}`;
            const cachedData = await AsyncStorage.getItem(cacheKey);
            
            if (cachedData) {
              const offlineData: OfflineData = JSON.parse(cachedData);
              if (now - offlineData.timestamp <= this.cacheExpiry) {
                validItems.push(item);
              } else {
                await AsyncStorage.removeItem(cacheKey);
              }
            }
          }

          await AsyncStorage.setItem(indexKey, JSON.stringify(validItems));
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      let totalSize = 0;
      const keys = await AsyncStorage.getAllKeys();
      
      for (const key of keys) {
        if (key.startsWith('cache_')) {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith('cache_') || 
        key.startsWith('cache_index_') ||
        key === 'sync_queue' ||
        key === 'failed_syncs' ||
        key === 'conflict_resolutions'
      );

      await AsyncStorage.multiRemove(cacheKeys);
      this.syncQueue = [];
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
}

export const offlineStorageService = OfflineStorageService.getInstance();

