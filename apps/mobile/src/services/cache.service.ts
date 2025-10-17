import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/utils/constants';

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  defaultTtl: number; // Default time to live in milliseconds
  version: string; // Cache version for invalidation
  enableLRU: boolean; // Enable Least Recently Used eviction
}

class CacheService {
  private cache = new Map<string, CacheItem>();
  private config: CacheConfig;
  private currentSize = 0;
  private isInitialized = false;

  constructor() {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      defaultTtl: 24 * 60 * 60 * 1000, // 24 hours
      version: '1.0.0',
      enableLRU: true,
    };
  }

  async initialize(): Promise<void> {
    try {
      await this.loadFromStorage();
      this.isInitialized = true;
      console.log('Cache service initialized');
    } catch (error) {
      console.error('Failed to initialize cache service:', error);
      this.isInitialized = false;
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_DATA);
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        
        // Check version compatibility
        if (parsed.version !== this.config.version) {
          console.log('Cache version mismatch, clearing cache');
          await this.clearAll();
          return;
        }

        this.cache = new Map(parsed.items);
        this.currentSize = parsed.currentSize || 0;
        
        // Clean expired items on load
        await this.cleanExpiredItems();
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
      await this.clearAll();
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const cacheData = {
        version: this.config.version,
        items: Array.from(this.cache.entries()),
        currentSize: this.currentSize,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.CACHE_DATA, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save cache to storage:', error);
    }
  }

  async set<T>(
    key: string, 
    data: T, 
    ttl?: number, 
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Cache service not initialized');
      return;
    }

    const now = Date.now();
    const itemSize = this.calculateSize(data);
    const itemTtl = ttl || this.config.defaultTtl;

    // Check if we need to make space
    if (this.currentSize + itemSize > this.config.maxSize) {
      await this.makeSpace(itemSize);
    }

    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      ttl: itemTtl,
      version: this.config.version,
      accessCount: 0,
      lastAccessed: now,
      size: itemSize,
    };

    // Remove existing item if it exists
    const existingItem = this.cache.get(key);
    if (existingItem) {
      this.currentSize -= existingItem.size;
    }

    this.cache.set(key, cacheItem);
    this.currentSize += itemSize;

    // Save to persistent storage
    await this.saveToStorage();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isInitialized) {
      console.warn('Cache service not initialized');
      return null;
    }

    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // Check if item is expired
    if (this.isExpired(item)) {
      await this.delete(key);
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();
    this.cache.set(key, item);

    return item.data as T;
  }

  async delete(key: string): Promise<void> {
    const item = this.cache.get(key);
    if (item) {
      this.currentSize -= item.size;
      this.cache.delete(key);
      await this.saveToStorage();
    }
  }

  async clearAll(): Promise<void> {
    this.cache.clear();
    this.currentSize = 0;
    await AsyncStorage.removeItem(STORAGE_KEYS.CACHE_DATA);
  }

  async clearByPattern(pattern: RegExp): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  async invalidateVersion(version: string): Promise<void> {
    if (version !== this.config.version) {
      await this.clearAll();
      this.config.version = version;
    }
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private async cleanExpiredItems(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }

    if (keysToDelete.length > 0) {
      console.log(`Cleaned ${keysToDelete.length} expired cache items`);
    }
  }

  private async makeSpace(requiredSize: number): Promise<void> {
    if (!this.config.enableLRU) {
      // If LRU is disabled, just clear everything
      await this.clearAll();
      return;
    }

    // Sort items by access frequency and recency
    const sortedItems = Array.from(this.cache.entries()).sort((a, b) => {
      const scoreA = this.calculateLRUScore(a[1]);
      const scoreB = this.calculateLRUScore(b[1]);
      return scoreA - scoreB; // Lower score = more likely to be evicted
    });

    let freedSpace = 0;
    const itemsToDelete: string[] = [];

    for (const [key, item] of sortedItems) {
      itemsToDelete.push(key);
      freedSpace += item.size;
      
      if (this.currentSize - freedSpace + requiredSize <= this.config.maxSize) {
        break;
      }
    }

    // Delete the least recently used items
    for (const key of itemsToDelete) {
      await this.delete(key);
    }

    console.log(`Evicted ${itemsToDelete.length} cache items to make space`);
  }

  private calculateLRUScore(item: CacheItem): number {
    const now = Date.now();
    const age = now - item.timestamp;
    const accessFrequency = item.accessCount / Math.max(age / (60 * 1000), 1); // accesses per minute
    const recency = now - item.lastAccessed;
    
    // Lower score means more likely to be evicted
    return recency - (accessFrequency * 1000); // Weight access frequency more heavily
  }

  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1024; // Default size if serialization fails
    }
  }

  // Utility methods for specific data types
  async setEvents(events: any[]): Promise<void> {
    await this.set('events:list', events, 30 * 60 * 1000, 'high'); // 30 minutes
  }

  async getEvents(): Promise<any[] | null> {
    return this.get('events:list');
  }

  async setEvent(eventId: string, event: any): Promise<void> {
    await this.set(`event:${eventId}`, event, 60 * 60 * 1000, 'high'); // 1 hour
  }

  async getEvent(eventId: string): Promise<any | null> {
    return this.get(`event:${eventId}`);
  }

  async setUserProfile(profile: any): Promise<void> {
    await this.set('user:profile', profile, 24 * 60 * 60 * 1000, 'high'); // 24 hours
  }

  async getUserProfile(): Promise<any | null> {
    return this.get('user:profile');
  }

  async setTickets(tickets: any[]): Promise<void> {
    await this.set('tickets:list', tickets, 15 * 60 * 1000, 'high'); // 15 minutes
  }

  async getTickets(): Promise<any[] | null> {
    return this.get('tickets:list');
  }

  // Cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    itemCount: number;
    hitRate: number;
    memoryUsage: string;
  } {
    const totalAccesses = Array.from(this.cache.values()).reduce(
      (sum, item) => sum + item.accessCount, 
      0
    );
    
    return {
      size: this.currentSize,
      maxSize: this.config.maxSize,
      itemCount: this.cache.size,
      hitRate: totalAccesses > 0 ? totalAccesses / this.cache.size : 0,
      memoryUsage: `${Math.round((this.currentSize / 1024 / 1024) * 100) / 100}MB`,
    };
  }

  // Configuration methods
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }
}

export const cacheService = new CacheService();
