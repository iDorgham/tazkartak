import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { offlineStorageService, SyncQueueItem, ConflictResolution } from '@/services/offline-storage.service';
import { offlineSyncService, SyncStats } from '@/services/offline-sync.service';
import { offlineDataService } from '@/services/offline-data.service';
import { netInfo } from '@/services/network.service';

interface OfflineState {
  isOnline: boolean;
  isConnected: boolean;
  syncInProgress: boolean;
  lastSyncTime: number;
  nextSyncTime: number;
  pendingSyncCount: number;
  failedSyncs: any[];
  conflicts: ConflictResolution[];
  syncStats: SyncStats;
  cacheStats: {
    totalItems: number;
    cacheSize: number;
    pendingSync: number;
  };
  syncConfig: {
    enabled: boolean;
    interval: number;
    batchSize: number;
    retryDelay: number;
    maxRetries: number;
    syncOnAppStateChange: boolean;
    syncOnNetworkChange: boolean;
  };
  syncQueue: SyncQueueItem[];
}

const initialState: OfflineState = {
  isOnline: true,
  isConnected: true,
  syncInProgress: false,
  lastSyncTime: 0,
  nextSyncTime: 0,
  pendingSyncCount: 0,
  failedSyncs: [],
  conflicts: [],
  syncStats: {
    totalSynced: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    lastSyncTime: 0,
    nextSyncTime: 0,
    pendingItems: 0,
  },
  cacheStats: {
    totalItems: 0,
    cacheSize: 0,
    pendingSync: 0,
  },
  syncConfig: {
    enabled: true,
    interval: 5 * 60 * 1000, // 5 minutes
    batchSize: 10,
    retryDelay: 1000,
    maxRetries: 3,
    syncOnAppStateChange: true,
    syncOnNetworkChange: true,
  },
  syncQueue: [],
};

// Async thunks
export const initializeOfflineService = createAsyncThunk(
  'offline/initializeOfflineService',
  async (_, { rejectWithValue }) => {
    try {
      await offlineSyncService.initialize();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize offline service');
    }
  }
);

export const performSync = createAsyncThunk(
  'offline/performSync',
  async (_, { rejectWithValue }) => {
    try {
      await offlineSyncService.performSync();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sync failed');
    }
  }
);

export const syncSpecificType = createAsyncThunk(
  'offline/syncSpecificType',
  async (type: string, { rejectWithValue }) => {
    try {
      await offlineSyncService.syncSpecificType(type);
      return type;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to sync ${type}`);
    }
  }
);

export const forceSyncAll = createAsyncThunk(
  'offline/forceSyncAll',
  async (_, { rejectWithValue }) => {
    try {
      await offlineSyncService.forceSyncAll();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Force sync failed');
    }
  }
);

export const retryFailedSync = createAsyncThunk(
  'offline/retryFailedSync',
  async (failedSyncId: string, { rejectWithValue }) => {
    try {
      await offlineSyncService.retryFailedSync(failedSyncId);
      return failedSyncId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to retry sync');
    }
  }
);

export const resolveConflict = createAsyncThunk(
  'offline/resolveConflict',
  async ({ type, id, resolution }: { type: string; id: string; resolution: 'local' | 'remote' | 'merge' }, { rejectWithValue }) => {
    try {
      await offlineStorageService.resolveConflict(type, id, resolution);
      return { type, id, resolution };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resolve conflict');
    }
  }
);

export const clearCache = createAsyncThunk(
  'offline/clearCache',
  async (type?: string, { rejectWithValue }) => {
    try {
      await offlineDataService.clearCache(type);
      return type;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clear cache');
    }
  }
);

export const preloadData = createAsyncThunk(
  'offline/preloadData',
  async ({ type, ids }: { type: string; ids?: string[] }, { rejectWithValue }) => {
    try {
      await offlineDataService.preloadData(type, ids);
      return { type, ids };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to preload data');
    }
  }
);

export const updateSyncConfig = createAsyncThunk(
  'offline/updateSyncConfig',
  async (config: Partial<typeof initialState.syncConfig>, { rejectWithValue }) => {
    try {
      offlineSyncService.updateSyncConfig(config);
      return config;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update sync config');
    }
  }
);

export const fetchOfflineStats = createAsyncThunk(
  'offline/fetchOfflineStats',
  async (_, { rejectWithValue }) => {
    try {
      const [syncStats, cacheStats, failedSyncs, conflicts, syncQueue] = await Promise.all([
        Promise.resolve(offlineSyncService.getSyncStats()),
        offlineDataService.getCacheStats(),
        offlineSyncService.getFailedSyncs(),
        offlineStorageService.getConflictResolutions(),
        Promise.resolve(offlineStorageService.getSyncQueue()),
      ]);

      return {
        syncStats,
        cacheStats,
        failedSyncs,
        conflicts,
        syncQueue,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch offline stats');
    }
  }
);

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      state.isConnected = action.payload;
    },
    setSyncInProgress: (state, action: PayloadAction<boolean>) => {
      state.syncInProgress = action.payload;
    },
    updateSyncStats: (state, action: PayloadAction<SyncStats>) => {
      state.syncStats = action.payload;
    },
    updateCacheStats: (state, action: PayloadAction<typeof initialState.cacheStats>) => {
      state.cacheStats = action.payload;
    },
    updateSyncQueue: (state, action: PayloadAction<SyncQueueItem[]>) => {
      state.syncQueue = action.payload;
      state.pendingSyncCount = action.payload.length;
    },
    addFailedSync: (state, action: PayloadAction<any>) => {
      state.failedSyncs.push(action.payload);
    },
    removeFailedSync: (state, action: PayloadAction<string>) => {
      state.failedSyncs = state.failedSyncs.filter(sync => sync.id !== action.payload);
    },
    addConflict: (state, action: PayloadAction<ConflictResolution>) => {
      state.conflicts.push(action.payload);
    },
    resolveConflict: (state, action: PayloadAction<string>) => {
      state.conflicts = state.conflicts.filter(conflict => conflict.id !== action.payload);
    },
    clearError: (state) => {
      // Clear any error state if needed
    },
    enableSync: (state) => {
      state.syncConfig.enabled = true;
      offlineSyncService.enableSync();
    },
    disableSync: (state) => {
      state.syncConfig.enabled = false;
      offlineSyncService.disableSync();
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize Offline Service
      .addCase(initializeOfflineService.fulfilled, (state) => {
        // Service initialized successfully
      })
      .addCase(initializeOfflineService.rejected, (state, action) => {
        console.error('Failed to initialize offline service:', action.payload);
      })
      
      // Perform Sync
      .addCase(performSync.pending, (state) => {
        state.syncInProgress = true;
      })
      .addCase(performSync.fulfilled, (state) => {
        state.syncInProgress = false;
        state.lastSyncTime = Date.now();
      })
      .addCase(performSync.rejected, (state, action) => {
        state.syncInProgress = false;
        console.error('Sync failed:', action.payload);
      })
      
      // Sync Specific Type
      .addCase(syncSpecificType.pending, (state) => {
        state.syncInProgress = true;
      })
      .addCase(syncSpecificType.fulfilled, (state) => {
        state.syncInProgress = false;
        state.lastSyncTime = Date.now();
      })
      .addCase(syncSpecificType.rejected, (state, action) => {
        state.syncInProgress = false;
        console.error('Type sync failed:', action.payload);
      })
      
      // Force Sync All
      .addCase(forceSyncAll.pending, (state) => {
        state.syncInProgress = true;
      })
      .addCase(forceSyncAll.fulfilled, (state) => {
        state.syncInProgress = false;
        state.lastSyncTime = Date.now();
      })
      .addCase(forceSyncAll.rejected, (state, action) => {
        state.syncInProgress = false;
        console.error('Force sync failed:', action.payload);
      })
      
      // Retry Failed Sync
      .addCase(retryFailedSync.fulfilled, (state, action) => {
        state.failedSyncs = state.failedSyncs.filter(sync => sync.id !== action.payload);
      })
      .addCase(retryFailedSync.rejected, (state, action) => {
        console.error('Failed to retry sync:', action.payload);
      })
      
      // Resolve Conflict
      .addCase(resolveConflict.fulfilled, (state, action) => {
        state.conflicts = state.conflicts.filter(conflict => 
          !(conflict.id === `conflict_${action.payload.type}_${action.payload.id}`)
        );
      })
      .addCase(resolveConflict.rejected, (state, action) => {
        console.error('Failed to resolve conflict:', action.payload);
      })
      
      // Clear Cache
      .addCase(clearCache.fulfilled, (state) => {
        state.cacheStats = {
          totalItems: 0,
          cacheSize: 0,
          pendingSync: state.cacheStats.pendingSync,
        };
      })
      .addCase(clearCache.rejected, (state, action) => {
        console.error('Failed to clear cache:', action.payload);
      })
      
      // Preload Data
      .addCase(preloadData.fulfilled, (state) => {
        // Data preloaded successfully
      })
      .addCase(preloadData.rejected, (state, action) => {
        console.error('Failed to preload data:', action.payload);
      })
      
      // Update Sync Config
      .addCase(updateSyncConfig.fulfilled, (state, action) => {
        state.syncConfig = { ...state.syncConfig, ...action.payload };
      })
      .addCase(updateSyncConfig.rejected, (state, action) => {
        console.error('Failed to update sync config:', action.payload);
      })
      
      // Fetch Offline Stats
      .addCase(fetchOfflineStats.fulfilled, (state, action) => {
        state.syncStats = action.payload.syncStats;
        state.cacheStats = action.payload.cacheStats;
        state.failedSyncs = action.payload.failedSyncs;
        state.conflicts = action.payload.conflicts;
        state.syncQueue = action.payload.syncQueue;
        state.pendingSyncCount = action.payload.syncQueue.length;
      })
      .addCase(fetchOfflineStats.rejected, (state, action) => {
        console.error('Failed to fetch offline stats:', action.payload);
      });
  },
});

export const {
  setOnlineStatus,
  setSyncInProgress,
  updateSyncStats,
  updateCacheStats,
  updateSyncQueue,
  addFailedSync,
  removeFailedSync,
  addConflict,
  resolveConflict: resolveConflictAction,
  clearError,
  enableSync,
  disableSync,
} = offlineSlice.actions;

export default offlineSlice.reducer;

