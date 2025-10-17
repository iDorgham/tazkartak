import { AppState, AppStateStatus } from 'react-native';
import BackgroundJob from 'react-native-background-job';
import { offlineStorageService, SyncQueueItem } from './offline-storage.service';
import { netInfo } from './network.service';
import { apiService } from './api.service';

export interface SyncConfig {
  enabled: boolean;
  interval: number; // milliseconds
  batchSize: number;
  retryDelay: number;
  maxRetries: number;
  syncOnAppStateChange: boolean;
  syncOnNetworkChange: boolean;
}

export interface SyncStats {
  totalSynced: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSyncTime: number;
  nextSyncTime: number;
  pendingItems: number;
}

class OfflineSyncService {
  private static instance: OfflineSyncService;
  private syncConfig: SyncConfig = {
    enabled: true,
    interval: 5 * 60 * 1000, // 5 minutes
    batchSize: 10,
    retryDelay: 1000,
    maxRetries: 3,
    syncOnAppStateChange: true,
    syncOnNetworkChange: true,
  };
  private syncTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private syncStats: SyncStats = {
    totalSynced: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    lastSyncTime: 0,
    nextSyncTime: 0,
    pendingItems: 0,
  };

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.setupBackgroundJob();
      this.setupAppStateListener();
      this.setupNetworkListener();
      this.startPeriodicSync();
      
      this.isInitialized = true;
      console.log('Offline sync service initialized');
    } catch (error) {
      console.error('Failed to initialize offline sync service:', error);
    }
  }

  private async setupBackgroundJob(): Promise<void> {
    try {
      BackgroundJob.register({
        jobKey: 'offlineSync',
        period: this.syncConfig.interval,
        requiredNetworkType: 'ANY',
        job: () => {
          console.log('Background sync job triggered');
          this.performSync();
        },
      });
    } catch (error) {
      console.error('Failed to setup background job:', error);
    }
  }

  private setupAppStateListener(): void {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private setupNetworkListener(): void {
    // Network listener is handled by offlineStorageService
    // This service will react to network changes through that
  }

  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'active' && this.syncConfig.syncOnAppStateChange) {
      console.log('App became active, triggering sync...');
      this.performSync();
    }
  };

  private startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.syncConfig.enabled) {
        this.performSync();
      }
    }, this.syncConfig.interval);

    this.updateNextSyncTime();
  }

  private updateNextSyncTime(): void {
    this.syncStats.nextSyncTime = Date.now() + this.syncConfig.interval;
  }

  async performSync(): Promise<void> {
    if (!this.syncConfig.enabled || !netInfo.isConnected()) {
      console.log('Sync skipped - disabled or offline');
      return;
    }

    try {
      console.log('Starting sync process...');
      const queueItems = offlineStorageService.getSyncQueue();
      const batchSize = Math.min(this.syncConfig.batchSize, queueItems.length);
      
      if (batchSize === 0) {
        console.log('No items to sync');
        this.updateSyncStats(0, 0, 0);
        return;
      }

      const batch = queueItems.slice(0, batchSize);
      let successful = 0;
      let failed = 0;

      for (const item of batch) {
        try {
          await this.syncItem(item);
          await offlineStorageService.removeFromSyncQueue(item.id);
          successful++;
        } catch (error) {
          console.error('Failed to sync item:', error);
          failed++;
          await this.handleSyncFailure(item, error);
        }
      }

      this.updateSyncStats(batchSize, successful, failed);
      this.syncStats.lastSyncTime = Date.now();
      
      console.log(`Sync completed: ${successful} successful, ${failed} failed`);
    } catch (error) {
      console.error('Sync process failed:', error);
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    try {
      const { operation, type, data } = item;

      switch (operation) {
        case 'create':
          await this.syncCreateOperation(type, data);
          break;
        case 'update':
          await this.syncUpdateOperation(type, data);
          break;
        case 'delete':
          await this.syncDeleteOperation(type, data);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      // Mark as synced in cache
      if (data.id) {
        await offlineStorageService.markDataAsSynced(type, data.id);
      }
    } catch (error) {
      throw error;
    }
  }

  private async syncCreateOperation(type: string, data: any): Promise<void> {
    try {
      const endpoint = this.getApiEndpoint(type);
      const response = await apiService.post(endpoint, data);
      
      // Update local cache with server response
      if (response.data && data.id) {
        await offlineStorageService.cacheData(type, data.id, response.data, Date.now());
      }
    } catch (error) {
      console.error(`Failed to sync create for ${type}:`, error);
      throw error;
    }
  }

  private async syncUpdateOperation(type: string, data: any): Promise<void> {
    try {
      const endpoint = `${this.getApiEndpoint(type)}/${data.id}`;
      const response = await apiService.put(endpoint, data);
      
      // Update local cache with server response
      if (response.data) {
        await offlineStorageService.cacheData(type, data.id, response.data, Date.now());
      }
    } catch (error) {
      console.error(`Failed to sync update for ${type}:`, error);
      throw error;
    }
  }

  private async syncDeleteOperation(type: string, data: any): Promise<void> {
    try {
      const endpoint = `${this.getApiEndpoint(type)}/${data.id}`;
      await apiService.delete(endpoint);
      
      // Remove from local cache
      await offlineStorageService.removeCachedData(type, data.id);
    } catch (error) {
      console.error(`Failed to sync delete for ${type}:`, error);
      throw error;
    }
  }

  private getApiEndpoint(type: string): string {
    const endpoints: Record<string, string> = {
      event: '/events',
      ticket: '/tickets',
      venue: '/venues',
      user: '/users',
      payment: '/payments',
    };
    
    return endpoints[type] || `/${type}`;
  }

  private async handleSyncFailure(item: SyncQueueItem, error: any): Promise<void> {
    try {
      // Update retry count
      item.retryCount = (item.retryCount || 0) + 1;
      
      if (item.retryCount >= this.syncConfig.maxRetries) {
        console.error(`Max retries exceeded for sync item: ${item.id}`);
        await offlineStorageService.removeFromSyncQueue(item.id);
        
        // Store failed sync for manual resolution
        await this.storeFailedSync(item, error);
      } else {
        // Schedule retry with exponential backoff
        const delay = this.syncConfig.retryDelay * Math.pow(2, item.retryCount - 1);
        setTimeout(() => {
          this.performSync();
        }, delay);
      }
    } catch (error) {
      console.error('Failed to handle sync failure:', error);
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
      
      await offlineStorageService.storeFailedSync(item, error);
    } catch (error) {
      console.error('Failed to store failed sync:', error);
    }
  }

  async getFailedSyncs(): Promise<any[]> {
    return await offlineStorageService.getFailedSyncs();
  }

  async retryFailedSync(failedSyncId: string): Promise<void> {
    try {
      const failedSyncs = await this.getFailedSyncs();
      const failedSync = failedSyncs.find(sync => sync.id === failedSyncId);
      
      if (!failedSync) {
        throw new Error('Failed sync not found');
      }

      // Reset retry count and add back to sync queue
      const queueItem: SyncQueueItem = {
        ...failedSync,
        retryCount: 0,
        timestamp: Date.now(),
      };

      await offlineStorageService.addToSyncQueue(
        queueItem.operation,
        queueItem.type,
        queueItem.data,
        queueItem.priority
      );

      // Remove from failed syncs
      const updatedFailedSyncs = failedSyncs.filter(sync => sync.id !== failedSyncId);
      // Store updated failed syncs (implementation depends on storage method)

      console.log(`Retrying failed sync: ${failedSyncId}`);
      this.performSync();
    } catch (error) {
      console.error('Failed to retry failed sync:', error);
      throw error;
    }
  }

  // Configuration Management
  updateSyncConfig(config: Partial<SyncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...config };
    
    if (config.interval) {
      this.startPeriodicSync();
    }
  }

  getSyncConfig(): SyncConfig {
    return { ...this.syncConfig };
  }

  enableSync(): void {
    this.syncConfig.enabled = true;
    this.startPeriodicSync();
  }

  disableSync(): void {
    this.syncConfig.enabled = false;
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // Statistics
  private updateSyncStats(total: number, successful: number, failed: number): void {
    this.syncStats.totalSynced += total;
    this.syncStats.successfulSyncs += successful;
    this.syncStats.failedSyncs += failed;
    this.syncStats.pendingItems = offlineStorageService.getPendingSyncCount();
  }

  getSyncStats(): SyncStats {
    return {
      ...this.syncStats,
      pendingItems: offlineStorageService.getPendingSyncCount(),
    };
  }

  // Manual Sync Operations
  async syncNow(): Promise<void> {
    console.log('Manual sync triggered');
    await this.performSync();
  }

  async syncSpecificType(type: string): Promise<void> {
    try {
      const queueItems = offlineStorageService.getSyncQueue();
      const typeItems = queueItems.filter(item => item.type === type);
      
      for (const item of typeItems) {
        try {
          await this.syncItem(item);
          await offlineStorageService.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error(`Failed to sync ${type} item:`, error);
        }
      }
      
      console.log(`Manual sync completed for type: ${type}`);
    } catch (error) {
      console.error(`Failed to sync type ${type}:`, error);
      throw error;
    }
  }

  async forceSyncAll(): Promise<void> {
    try {
      console.log('Force sync all triggered');
      const queueItems = offlineStorageService.getSyncQueue();
      
      for (const item of queueItems) {
        try {
          await this.syncItem(item);
          await offlineStorageService.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error('Failed to force sync item:', error);
        }
      }
      
      console.log('Force sync all completed');
    } catch (error) {
      console.error('Force sync all failed:', error);
      throw error;
    }
  }

  // Cleanup
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    AppState.removeEventListener('change', this.handleAppStateChange);
    this.isInitialized = false;
  }
}

export const offlineSyncService = OfflineSyncService.getInstance();

