import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { STORAGE_KEYS, OFFLINE_CONFIG } from '@/utils/constants';
import { cacheService } from './cache.service';

interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  optimisticId?: string; // For optimistic UI updates
  priority: 'low' | 'medium' | 'high';
  conflictResolution?: 'server' | 'client' | 'merge' | 'manual';
}

interface ConflictResolutionStrategy {
  strategy: 'server' | 'client' | 'merge' | 'manual';
  mergeFunction?: (clientData: any, serverData: any) => any;
  timestamp: number;
}

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

class OfflineService {
  private isOnline: boolean = true;
  private syncQueue: OfflineAction[] = [];
  private syncInProgress: boolean = false;
  private optimisticUpdates = new Map<string, any>(); // Track optimistic updates
  private conflictStrategies = new Map<string, ConflictResolutionStrategy>();

  constructor() {
    this.initializeNetworkListener();
    this.loadSyncQueue();
    this.initializeConflictStrategies();
  }

  private initializeNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.isOnline) {
        this.processSyncQueue();
      }
    });
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private initializeConflictStrategies(): void {
    // Define conflict resolution strategies for different action types
    this.conflictStrategies.set('CREATE_EVENT', {
      strategy: 'client',
      timestamp: Date.now(),
    });

    this.conflictStrategies.set('UPDATE_EVENT', {
      strategy: 'merge',
      mergeFunction: this.mergeEventData,
      timestamp: Date.now(),
    });

    this.conflictStrategies.set('PURCHASE_TICKET', {
      strategy: 'server', // Server has final say on ticket availability
      timestamp: Date.now(),
    });

    this.conflictStrategies.set('UPDATE_PROFILE', {
      strategy: 'merge',
      mergeFunction: this.mergeProfileData,
      timestamp: Date.now(),
    });

    this.conflictStrategies.set('CREATE_VENUE', {
      strategy: 'client',
      timestamp: Date.now(),
    });
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  // Cache management
  async setCacheItem<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Failed to cache item:', error);
    }
  }

  async getCacheItem<T>(key: string): Promise<T | null> {
    try {
      const cacheData = await AsyncStorage.getItem(key);
      if (!cacheData) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cacheData);
      
      // Check if cache is expired
      if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Failed to get cache item:', error);
      return null;
    }
  }

  async removeCacheItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove cache item:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith('cache_') || 
        key.includes('_cache') ||
        key === STORAGE_KEYS.CACHED_EVENTS ||
        key === STORAGE_KEYS.CACHED_TICKETS
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Optimistic UI Updates
  async performOptimisticUpdate<T>(
    actionType: string,
    payload: any,
    optimisticData: T,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<{ actionId: string; optimisticId: string }> {
    const actionId = this.generateId();
    const optimisticId = this.generateId();

    // Store optimistic update
    this.optimisticUpdates.set(optimisticId, optimisticData);

    // Add to sync queue with optimistic ID
    const offlineAction: OfflineAction = {
      id: actionId,
      type: actionType,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: OFFLINE_CONFIG.MAX_RETRY_ATTEMPTS,
      optimisticId,
      priority,
      conflictResolution: this.conflictStrategies.get(actionType)?.strategy,
    };

    this.syncQueue.push(offlineAction);
    await this.saveSyncQueue();

    // If online, try to sync immediately
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return { actionId, optimisticId };
  }

  getOptimisticUpdate(optimisticId: string): any {
    return this.optimisticUpdates.get(optimisticId);
  }

  removeOptimisticUpdate(optimisticId: string): void {
    this.optimisticUpdates.delete(optimisticId);
  }

  // Offline queue management
  async addToSyncQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const offlineAction: OfflineAction = {
      ...action,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
      priority: action.priority || 'medium',
      conflictResolution: action.conflictResolution || this.conflictStrategies.get(action.type)?.strategy,
    };

    this.syncQueue.push(offlineAction);
    
    // Sort by priority (high -> medium -> low)
    this.syncQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // Limit queue size
    if (this.syncQueue.length > OFFLINE_CONFIG.MAX_QUEUE_SIZE) {
      this.syncQueue = this.syncQueue.slice(0, OFFLINE_CONFIG.MAX_QUEUE_SIZE);
    }

    await this.saveSyncQueue();
    return offlineAction.id;
  }

  async removeFromSyncQueue(actionId: string): Promise<void> {
    this.syncQueue = this.syncQueue.filter(action => action.id !== actionId);
    await this.saveSyncQueue();
  }

  async clearSyncQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveSyncQueue();
  }

  // Sync processing
  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      const actionsToProcess = [...this.syncQueue];
      
      for (const action of actionsToProcess) {
        try {
          const success = await this.processActionWithConflictResolution(action);
          if (success) {
            await this.removeFromSyncQueue(action.id);
          } else if (action.retryCount >= action.maxRetries) {
            await this.removeFromSyncQueue(action.id);
            if (action.optimisticId) {
              this.removeOptimisticUpdate(action.optimisticId);
            }
          }
        } catch (error) {
          console.error(`Failed to process action ${action.id}:`, error);
          
          action.retryCount++;
          if (action.retryCount >= action.maxRetries) {
            await this.removeFromSyncQueue(action.id);
            if (action.optimisticId) {
              this.removeOptimisticUpdate(action.optimisticId);
            }
          } else {
            // Exponential backoff
            const delay = OFFLINE_CONFIG.RETRY_DELAY * Math.pow(2, action.retryCount);
            setTimeout(() => {
              this.processSyncQueue();
            }, delay);
          }
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processAction(action: OfflineAction): Promise<void> {
    // This would be implemented based on the specific action types
    // For now, we'll just simulate the processing
    console.log('Processing offline action:', action);
    
    // In a real implementation, you would:
    // 1. Determine the action type
    // 2. Call the appropriate API service method
    // 3. Handle the response
    // 4. Update local state if needed
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  isConnected(): boolean {
    return this.isOnline;
  }

  getQueueSize(): number {
    return this.syncQueue.length;
  }

  getQueueActions(): OfflineAction[] {
    return [...this.syncQueue];
  }

  // Conflict Resolution Methods
  private mergeEventData(clientData: any, serverData: any): any {
    // Merge event data with server taking precedence for critical fields
    return {
      ...clientData,
      ...serverData,
      // Client can override these fields
      description: clientData.description || serverData.description,
      imageUrl: clientData.imageUrl || serverData.imageUrl,
      // Server takes precedence for these
      id: serverData.id,
      createdAt: serverData.createdAt,
      updatedAt: serverData.updatedAt,
      status: serverData.status,
    };
  }

  private mergeProfileData(clientData: any, serverData: any): any {
    // Merge profile data with client taking precedence for user-editable fields
    return {
      ...serverData,
      ...clientData,
      // Server takes precedence for these
      id: serverData.id,
      email: serverData.email,
      role: serverData.role,
      status: serverData.status,
      createdAt: serverData.createdAt,
      updatedAt: serverData.updatedAt,
    };
  }

  async resolveConflict(
    action: OfflineAction,
    clientData: any,
    serverData: any
  ): Promise<any> {
    const strategy = this.conflictStrategies.get(action.type);
    
    if (!strategy) {
      console.warn(`No conflict resolution strategy for action type: ${action.type}`);
      return serverData; // Default to server data
    }

    switch (strategy.strategy) {
      case 'server':
        console.log(`Using server data for conflict resolution: ${action.type}`);
        return serverData;
        
      case 'client':
        console.log(`Using client data for conflict resolution: ${action.type}`);
        return clientData;
        
      case 'merge':
        if (strategy.mergeFunction) {
          console.log(`Merging data for conflict resolution: ${action.type}`);
          return strategy.mergeFunction(clientData, serverData);
        }
        return serverData;
        
      case 'manual':
        console.log(`Manual conflict resolution required for: ${action.type}`);
        // In a real app, this would trigger a UI for user to resolve manually
        return serverData;
        
      default:
        return serverData;
    }
  }

  // Enhanced sync processing with conflict resolution
  private async processActionWithConflictResolution(action: OfflineAction): Promise<boolean> {
    try {
      // Get optimistic update if exists
      const optimisticData = action.optimisticId ? 
        this.optimisticUpdates.get(action.optimisticId) : null;

      // Simulate API call
      const serverResponse = await this.simulateAPICall(action);
      
      if (serverResponse.success) {
        // Success - remove optimistic update and sync queue item
        if (action.optimisticId) {
          this.removeOptimisticUpdate(action.optimisticId);
        }
        await this.removeFromSyncQueue(action.id);
        
        // Update cache with server data
        await this.updateCacheWithServerData(action, serverResponse.data);
        
        return true;
      } else if (serverResponse.conflict) {
        // Handle conflict
        const resolvedData = await this.resolveConflict(
          action,
          optimisticData || action.payload,
          serverResponse.data
        );
        
        // Retry with resolved data
        const retryAction = {
          ...action,
          payload: resolvedData,
          retryCount: action.retryCount + 1,
        };
        
        if (retryAction.retryCount < action.maxRetries) {
          // Replace in queue
          const index = this.syncQueue.findIndex(a => a.id === action.id);
          if (index !== -1) {
            this.syncQueue[index] = retryAction;
            await this.saveSyncQueue();
          }
        } else {
          // Max retries reached, remove from queue
          await this.removeFromSyncQueue(action.id);
          if (action.optimisticId) {
            this.removeOptimisticUpdate(action.optimisticId);
          }
        }
        
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error processing action with conflict resolution:', error);
      return false;
    }
  }

  private async updateCacheWithServerData(action: OfflineAction, serverData: any): Promise<void> {
    // Update cache based on action type
    switch (action.type) {
      case 'CREATE_EVENT':
      case 'UPDATE_EVENT':
        await cacheService.setEvent(serverData.id, serverData);
        break;
      case 'PURCHASE_TICKET':
        await cacheService.setTickets([serverData]);
        break;
      case 'UPDATE_PROFILE':
        await cacheService.setUserProfile(serverData);
        break;
    }
  }

  private async simulateAPICall(action: OfflineAction): Promise<any> {
    // Simulate API call with potential conflict
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 10% chance of conflict for updates
        const hasConflict = action.type.includes('UPDATE') && Math.random() < 0.1;
        
        resolve({
          success: !hasConflict,
          conflict: hasConflict,
          data: hasConflict ? { id: action.payload.id, ...action.payload, updatedAt: new Date().toISOString() } : action.payload,
        });
      }, 1000);
    });
  }

  // Background sync
  async startBackgroundSync(): Promise<void> {
    // This would integrate with react-native-background-fetch
    // For now, we'll just set up a timer
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, OFFLINE_CONFIG.SYNC_INTERVAL);
  }

  // Cache size management
  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
      return 0;
    }
  }

  async cleanExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      
      for (const key of keys) {
        if (key.startsWith('cache_') || key.includes('_cache')) {
          const cacheData = await AsyncStorage.getItem(key);
          if (cacheData) {
            const cacheItem: CacheItem = JSON.parse(cacheData);
            if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
              await AsyncStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to clean expired cache:', error);
    }
  }

  // Data synchronization
  async syncUserData(): Promise<void> {
    // Sync user profile, preferences, etc.
    console.log('Syncing user data...');
  }

  async syncEvents(): Promise<void> {
    // Sync cached events with server
    console.log('Syncing events...');
  }

  async syncTickets(): Promise<void> {
    // Sync ticket purchases and updates
    console.log('Syncing tickets...');
  }

  async syncAll(): Promise<void> {
    if (!this.isOnline) return;
    
    await Promise.all([
      this.syncUserData(),
      this.syncEvents(),
      this.syncTickets(),
    ]);
  }
}

export const offlineService = new OfflineService();
