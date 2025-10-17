import { offlineStorageService } from './offline-storage.service';
import { apiService } from './api.service';
import { netInfo } from './network.service';

export interface OfflineDataOptions {
  forceRefresh?: boolean;
  maxAge?: number; // milliseconds
  fallbackToCache?: boolean;
}

export interface OfflineQueryOptions extends OfflineDataOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

class OfflineDataService {
  private static instance: OfflineDataService;

  static getInstance(): OfflineDataService {
    if (!OfflineDataService.instance) {
      OfflineDataService.instance = new OfflineDataService();
    }
    return OfflineDataService.instance;
  }

  // Generic data access methods
  async getData<T>(
    type: string,
    id: string,
    options: OfflineDataOptions = {}
  ): Promise<T | null> {
    try {
      const { forceRefresh = false, maxAge = 24 * 60 * 60 * 1000, fallbackToCache = true } = options;

      // Check if we should use cached data
      if (!forceRefresh && !netInfo.isConnected()) {
        console.log(`Offline mode: returning cached ${type} data for ${id}`);
        return await offlineStorageService.getCachedData(type, id);
      }

      // Try to fetch from API if online
      if (netInfo.isConnected()) {
        try {
          const response = await apiService.get(`/${type}/${id}`);
          const data = response.data;

          // Cache the fresh data
          await offlineStorageService.cacheData(type, id, data, Date.now());
          
          return data;
        } catch (error) {
          console.error(`Failed to fetch ${type} ${id} from API:`, error);
          
          // Fallback to cache if available and allowed
          if (fallbackToCache) {
            const cachedData = await offlineStorageService.getCachedData(type, id);
            if (cachedData) {
              console.log(`Using cached ${type} data for ${id} as fallback`);
              return cachedData;
            }
          }
          
          throw error;
        }
      }

      // Offline fallback
      if (fallbackToCache) {
        return await offlineStorageService.getCachedData(type, id);
      }

      return null;
    } catch (error) {
      console.error(`Error getting ${type} data for ${id}:`, error);
      throw error;
    }
  }

  async getDataList<T>(
    type: string,
    options: OfflineQueryOptions = {}
  ): Promise<T[]> {
    try {
      const { 
        forceRefresh = false, 
        maxAge = 24 * 60 * 60 * 1000, 
        fallbackToCache = true,
        limit = 20,
        offset = 0,
        sortBy,
        sortOrder = 'desc',
        filters = {}
      } = options;

      // Check if we should use cached data
      if (!forceRefresh && !netInfo.isConnected()) {
        console.log(`Offline mode: returning cached ${type} list`);
        const cachedData = await offlineStorageService.getAllCachedData(type);
        return this.processListData(cachedData, { limit, offset, sortBy, sortOrder, filters });
      }

      // Try to fetch from API if online
      if (netInfo.isConnected()) {
        try {
          const params = {
            limit,
            offset,
            ...filters,
            ...(sortBy && { sortBy, sortOrder }),
          };

          const response = await apiService.get(`/${type}`, { params });
          const data = response.data?.data || response.data || [];

          // Cache individual items
          for (const item of data) {
            if (item.id) {
              await offlineStorageService.cacheData(type, item.id, item, Date.now());
            }
          }

          return data;
        } catch (error) {
          console.error(`Failed to fetch ${type} list from API:`, error);
          
          // Fallback to cache if available and allowed
          if (fallbackToCache) {
            const cachedData = await offlineStorageService.getAllCachedData(type);
            if (cachedData.length > 0) {
              console.log(`Using cached ${type} list as fallback`);
              return this.processListData(cachedData, { limit, offset, sortBy, sortOrder, filters });
            }
          }
          
          throw error;
        }
      }

      // Offline fallback
      if (fallbackToCache) {
        const cachedData = await offlineStorageService.getAllCachedData(type);
        return this.processListData(cachedData, { limit, offset, sortBy, sortOrder, filters });
      }

      return [];
    } catch (error) {
      console.error(`Error getting ${type} list:`, error);
      throw error;
    }
  }

  private processListData<T>(
    data: T[],
    options: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: Record<string, any>;
    }
  ): T[] {
    let processedData = [...data];

    // Apply filters
    if (options.filters) {
      processedData = processedData.filter(item => {
        return Object.entries(options.filters).every(([key, value]) => {
          if (value === undefined || value === null) return true;
          
          const itemValue = (item as any)[key];
          if (typeof value === 'string') {
            return itemValue?.toString().toLowerCase().includes(value.toLowerCase());
          }
          
          return itemValue === value;
        });
      });
    }

    // Apply sorting
    if (options.sortBy) {
      processedData.sort((a, b) => {
        const aValue = (a as any)[options.sortBy!];
        const bValue = (b as any)[options.sortBy!];
        
        if (aValue < bValue) return options.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return options.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    
    return processedData.slice(offset, offset + limit);
  }

  // CRUD operations with offline support
  async createData<T>(
    type: string,
    data: any,
    options: { syncImmediately?: boolean } = {}
  ): Promise<T> {
    try {
      const { syncImmediately = true } = options;

      if (netInfo.isConnected() && syncImmediately) {
        // Create directly on server
        const response = await apiService.post(`/${type}`, data);
        const createdData = response.data;

        // Cache the created data
        if (createdData.id) {
          await offlineStorageService.cacheData(type, createdData.id, createdData, Date.now());
        }

        return createdData;
      } else {
        // Generate temporary ID for offline creation
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const offlineData = { ...data, id: tempId };

        // Cache locally
        await offlineStorageService.cacheData(type, tempId, offlineData, Date.now());

        // Add to sync queue
        await offlineStorageService.addToSyncQueue('create', type, offlineData, 'high');

        return offlineData;
      }
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
      throw error;
    }
  }

  async updateData<T>(
    type: string,
    id: string,
    data: any,
    options: { syncImmediately?: boolean } = {}
  ): Promise<T> {
    try {
      const { syncImmediately = true } = options;

      if (netInfo.isConnected() && syncImmediately) {
        // Update directly on server
        const response = await apiService.put(`/${type}/${id}`, data);
        const updatedData = response.data;

        // Update cache
        await offlineStorageService.cacheData(type, id, updatedData, Date.now());

        return updatedData;
      } else {
        // Get existing data and merge
        const existingData = await offlineStorageService.getCachedData(type, id);
        const mergedData = { ...existingData, ...data, id };

        // Update cache
        await offlineStorageService.cacheData(type, id, mergedData, Date.now());

        // Add to sync queue
        await offlineStorageService.addToSyncQueue('update', type, mergedData, 'medium');

        return mergedData;
      }
    } catch (error) {
      console.error(`Error updating ${type} ${id}:`, error);
      throw error;
    }
  }

  async deleteData(
    type: string,
    id: string,
    options: { syncImmediately?: boolean } = {}
  ): Promise<void> {
    try {
      const { syncImmediately = true } = options;

      if (netInfo.isConnected() && syncImmediately) {
        // Delete directly on server
        await apiService.delete(`/${type}/${id}`);

        // Remove from cache
        await offlineStorageService.removeCachedData(type, id);
      } else {
        // Remove from cache immediately
        await offlineStorageService.removeCachedData(type, id);

        // Add to sync queue
        await offlineStorageService.addToSyncQueue('delete', type, { id }, 'medium');
      }
    } catch (error) {
      console.error(`Error deleting ${type} ${id}:`, error);
      throw error;
    }
  }

  // Specialized methods for different data types
  async getEvents(options: OfflineQueryOptions = {}): Promise<any[]> {
    return this.getDataList('events', options);
  }

  async getEvent(id: string, options: OfflineDataOptions = {}): Promise<any | null> {
    return this.getData('events', id, options);
  }

  async createEvent(eventData: any, options = {}): Promise<any> {
    return this.createData('events', eventData, options);
  }

  async updateEvent(id: string, eventData: any, options = {}): Promise<any> {
    return this.updateData('events', id, eventData, options);
  }

  async deleteEvent(id: string, options = {}): Promise<void> {
    return this.deleteData('events', id, options);
  }

  async getTickets(options: OfflineQueryOptions = {}): Promise<any[]> {
    return this.getDataList('tickets', options);
  }

  async getTicket(id: string, options: OfflineDataOptions = {}): Promise<any | null> {
    return this.getData('tickets', id, options);
  }

  async createTicket(ticketData: any, options = {}): Promise<any> {
    return this.createData('tickets', ticketData, options);
  }

  async updateTicket(id: string, ticketData: any, options = {}): Promise<any> {
    return this.updateData('tickets', id, ticketData, options);
  }

  async deleteTicket(id: string, options = {}): Promise<void> {
    return this.deleteData('tickets', id, options);
  }

  async getVenues(options: OfflineQueryOptions = {}): Promise<any[]> {
    return this.getDataList('venues', options);
  }

  async getVenue(id: string, options: OfflineDataOptions = {}): Promise<any | null> {
    return this.getData('venues', id, options);
  }

  async createVenue(venueData: any, options = {}): Promise<any> {
    return this.createData('venues', venueData, options);
  }

  async updateVenue(id: string, venueData: any, options = {}): Promise<any> {
    return this.updateData('venues', id, venueData, options);
  }

  async deleteVenue(id: string, options = {}): Promise<void> {
    return this.deleteData('venues', id, options);
  }

  async getPayments(options: OfflineQueryOptions = {}): Promise<any[]> {
    return this.getDataList('payments', options);
  }

  async getPayment(id: string, options: OfflineDataOptions = {}): Promise<any | null> {
    return this.getData('payments', id, options);
  }

  async createPayment(paymentData: any, options = {}): Promise<any> {
    return this.createData('payments', paymentData, options);
  }

  async updatePayment(id: string, paymentData: any, options = {}): Promise<any> {
    return this.updateData('payments', id, paymentData, options);
  }

  async deletePayment(id: string, options = {}): Promise<void> {
    return this.deleteData('payments', id, options);
  }

  // Search functionality with offline support
  async searchData<T>(
    type: string,
    query: string,
    fields: string[],
    options: OfflineQueryOptions = {}
  ): Promise<T[]> {
    try {
      const { forceRefresh = false, fallbackToCache = true } = options;

      // Try online search first
      if (netInfo.isConnected() && !forceRefresh) {
        try {
          const params = {
            q: query,
            fields: fields.join(','),
            ...options.filters,
          };

          const response = await apiService.get(`/${type}/search`, { params });
          const data = response.data?.data || response.data || [];

          // Cache search results
          for (const item of data) {
            if (item.id) {
              await offlineStorageService.cacheData(type, item.id, item, Date.now());
            }
          }

          return data;
        } catch (error) {
          console.error(`Online search failed for ${type}:`, error);
        }
      }

      // Fallback to local search
      if (fallbackToCache) {
        const cachedData = await offlineStorageService.getAllCachedData(type);
        const searchResults = cachedData.filter(item => {
          return fields.some(field => {
            const value = (item as any)[field];
            return value?.toString().toLowerCase().includes(query.toLowerCase());
          });
        });

        return this.processListData(searchResults, options);
      }

      return [];
    } catch (error) {
      console.error(`Error searching ${type}:`, error);
      throw error;
    }
  }

  // Bulk operations
  async bulkCreateData<T>(
    type: string,
    dataList: any[],
    options: { batchSize?: number } = {}
  ): Promise<T[]> {
    const { batchSize = 10 } = options;
    const results: T[] = [];

    for (let i = 0; i < dataList.length; i += batchSize) {
      const batch = dataList.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(data => this.createData<T>(type, data, { syncImmediately: false }))
      );
      results.push(...batchResults);
    }

    return results;
  }

  async bulkUpdateData<T>(
    type: string,
    updates: Array<{ id: string; data: any }>,
    options: { batchSize?: number } = {}
  ): Promise<T[]> {
    const { batchSize = 10 } = options;
    const results: T[] = [];

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(({ id, data }) => this.updateData<T>(type, id, data, { syncImmediately: false }))
      );
      results.push(...batchResults);
    }

    return results;
  }

  // Cache management
  async clearCache(type?: string): Promise<void> {
    if (type) {
      const cachedData = await offlineStorageService.getAllCachedData(type);
      for (const item of cachedData) {
        await offlineStorageService.removeCachedData(type, item.id);
      }
    } else {
      await offlineStorageService.clearAllCache();
    }
  }

  async getCacheStats(): Promise<{
    totalItems: number;
    cacheSize: number;
    pendingSync: number;
  }> {
    const cacheSize = await offlineStorageService.getCacheSize();
    const pendingSync = offlineStorageService.getPendingSyncCount();

    // Count total cached items
    const types = ['events', 'tickets', 'venues', 'payments', 'users'];
    let totalItems = 0;
    
    for (const type of types) {
      const items = await offlineStorageService.getAllCachedData(type);
      totalItems += items.length;
    }

    return {
      totalItems,
      cacheSize,
      pendingSync,
    };
  }

  // Preload data for offline use
  async preloadData(type: string, ids?: string[]): Promise<void> {
    try {
      if (!netInfo.isConnected()) {
        console.log('Cannot preload data while offline');
        return;
      }

      if (ids) {
        // Preload specific items
        await Promise.all(
          ids.map(id => this.getData(type, id, { forceRefresh: true }))
        );
      } else {
        // Preload all items of a type
        await this.getDataList(type, { limit: 1000 });
      }

      console.log(`Preloaded ${type} data for offline use`);
    } catch (error) {
      console.error(`Failed to preload ${type} data:`, error);
    }
  }
}

export const offlineDataService = OfflineDataService.getInstance();

