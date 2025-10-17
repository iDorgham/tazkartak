import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { QRScanResult, Ticket } from '@/types/qr.types';
import { QREncryptionService } from './qr-encryption.service';

class OfflineQRService {
  private static readonly STORAGE_KEYS = {
    CACHED_TICKETS: 'cached_tickets',
    SCAN_QUEUE: 'scan_queue',
    SCANNED_TICKETS: 'scanned_tickets',
    LAST_SYNC: 'last_sync',
  };

  private static readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_CACHE_SIZE = 1000; // Maximum cached tickets

  /**
   * Cache valid tickets for an event for offline validation
   */
  static async cacheEventTickets(eventId: string, tickets: Ticket[]): Promise<void> {
    try {
      const cacheKey = `${this.STORAGE_KEYS.CACHED_TICKETS}_${eventId}`;
      const cacheData = {
        eventId,
        tickets: tickets.filter(ticket => ticket.status === 'active'),
        cachedAt: Date.now(),
        expiry: Date.now() + this.CACHE_EXPIRY,
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Clean up old cache entries
      await this.cleanupExpiredCache();
      
      console.log(`Cached ${cacheData.tickets.length} tickets for event ${eventId}`);
    } catch (error) {
      console.error('Failed to cache event tickets:', error);
      throw new Error('Failed to cache tickets for offline use');
    }
  }

  /**
   * Validate QR code offline using cached data
   */
  static async validateOffline(qrData: string, eventId?: string): Promise<{
    isValid: boolean;
    ticket?: Ticket;
    error?: string;
    fromCache: boolean;
  }> {
    try {
      // First, try to decrypt and validate the QR code
      const payload = await QREncryptionService.decryptAndValidate(qrData);
      
      if (!payload) {
        return { isValid: false, error: 'Invalid QR code format', fromCache: false };
      }

      // Check if ticket is expired
      if (QREncryptionService.isQRExpired(payload)) {
        return { isValid: false, error: 'QR code has expired', fromCache: false };
      }

      // If eventId is specified, check if it matches
      if (eventId && payload.eventId !== eventId) {
        return { isValid: false, error: 'Ticket is not for this event', fromCache: false };
      }

      // Check if ticket is already scanned
      const alreadyScanned = await this.isTicketScanned(payload.ticketId);
      if (alreadyScanned) {
        return {
          isValid: true,
          ticket: payload.ticket,
          error: 'Ticket already scanned',
          fromCache: true,
        };
      }

      // Try to find ticket in cache
      if (payload.eventId) {
        const cachedTicket = await this.findTicketInCache(payload.ticketId, payload.eventId);
        if (cachedTicket) {
          return {
            isValid: true,
            ticket: cachedTicket,
            fromCache: true,
          };
        }
      }

      // If not found in cache, we need online validation
      const isOnline = await this.isOnline();
      if (!isOnline) {
        return {
          isValid: false,
          error: 'Ticket not found in cache and no internet connection',
          fromCache: false,
        };
      }

      // For online validation, we'll queue the scan result
      return {
        isValid: false,
        error: 'Online validation required',
        fromCache: false,
      };
    } catch (error) {
      console.error('Offline validation error:', error);
      return {
        isValid: false,
        error: 'Validation failed',
        fromCache: false,
      };
    }
  }

  /**
   * Queue scan result for later sync when online
   */
  static async queueScanResult(scanData: Omit<QRScanResult, 'id'>): Promise<void> {
    try {
      const queueKey = this.STORAGE_KEYS.SCAN_QUEUE;
      const existingQueue = await AsyncStorage.getItem(queueKey);
      
      const queue: Omit<QRScanResult, 'id'>[] = existingQueue ? JSON.parse(existingQueue) : [];
      
      // Add unique ID and timestamp
      const scanResult: QRScanResult = {
        ...scanData,
        id: this.generateScanId(),
      };
      
      queue.push(scanResult);
      
      // Limit queue size to prevent storage bloat
      if (queue.length > 100) {
        queue.splice(0, queue.length - 100);
      }
      
      await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
      
      console.log(`Queued scan result for ticket ${scanData.ticketId}`);
    } catch (error) {
      console.error('Failed to queue scan result:', error);
      throw new Error('Failed to queue scan result');
    }
  }

  /**
   * Sync queued scans when online
   */
  static async syncQueuedScans(): Promise<{ success: number; failed: number }> {
    try {
      const isOnline = await this.isOnline();
      if (!isOnline) {
        console.log('No internet connection, skipping sync');
        return { success: 0, failed: 0 };
      }

      const queueKey = this.STORAGE_KEYS.SCAN_QUEUE;
      const queueData = await AsyncStorage.getItem(queueKey);
      
      if (!queueData) {
        return { success: 0, failed: 0 };
      }

      const queue: QRScanResult[] = JSON.parse(queueData);
      let successCount = 0;
      let failedCount = 0;

      for (const scanResult of queue) {
        try {
          // Here you would typically send the scan result to your backend
          // await apiService.syncScanResult(scanResult);
          
          // Mark ticket as scanned locally
          await this.markTicketAsScanned(scanResult.ticketId);
          
          successCount++;
          console.log(`Synced scan result for ticket ${scanResult.ticketId}`);
        } catch (error) {
          console.error(`Failed to sync scan result for ticket ${scanResult.ticketId}:`, error);
          failedCount++;
        }
      }

      // Clear successfully synced items
      if (successCount > 0) {
        const remainingQueue = queue.slice(successCount);
        await AsyncStorage.setItem(queueKey, JSON.stringify(remainingQueue));
      }

      // Update last sync time
      await AsyncStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, Date.now().toString());

      console.log(`Sync completed: ${successCount} success, ${failedCount} failed`);
      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error('Failed to sync queued scans:', error);
      throw new Error('Failed to sync scan results');
    }
  }

  /**
   * Check if a ticket has already been scanned
   */
  static async isTicketScanned(ticketId: string): Promise<boolean> {
    try {
      const scannedKey = this.STORAGE_KEYS.SCANNED_TICKETS;
      const scannedData = await AsyncStorage.getItem(scannedKey);
      
      if (!scannedData) {
        return false;
      }

      const scannedTickets: string[] = JSON.parse(scannedData);
      return scannedTickets.includes(ticketId);
    } catch (error) {
      console.error('Failed to check if ticket is scanned:', error);
      return false;
    }
  }

  /**
   * Mark a ticket as scanned
   */
  static async markTicketAsScanned(ticketId: string): Promise<void> {
    try {
      const scannedKey = this.STORAGE_KEYS.SCANNED_TICKETS;
      const scannedData = await AsyncStorage.getItem(scannedKey);
      
      const scannedTickets: string[] = scannedData ? JSON.parse(scannedData) : [];
      
      if (!scannedTickets.includes(ticketId)) {
        scannedTickets.push(ticketId);
        
        // Limit scanned tickets list size
        if (scannedTickets.length > this.MAX_CACHE_SIZE) {
          scannedTickets.splice(0, scannedTickets.length - this.MAX_CACHE_SIZE);
        }
        
        await AsyncStorage.setItem(scannedKey, JSON.stringify(scannedTickets));
      }
    } catch (error) {
      console.error('Failed to mark ticket as scanned:', error);
    }
  }

  /**
   * Get cached tickets for an event
   */
  static async getCachedEventTickets(eventId: string): Promise<Ticket[]> {
    try {
      const cacheKey = `${this.STORAGE_KEYS.CACHED_TICKETS}_${eventId}`;
      const cacheData = await AsyncStorage.getItem(cacheKey);
      
      if (!cacheData) {
        return [];
      }

      const cache = JSON.parse(cacheData);
      
      // Check if cache is expired
      if (Date.now() > cache.expiry) {
        await AsyncStorage.removeItem(cacheKey);
        return [];
      }

      return cache.tickets || [];
    } catch (error) {
      console.error('Failed to get cached event tickets:', error);
      return [];
    }
  }

  /**
   * Get queued scan results
   */
  static async getQueuedScans(): Promise<QRScanResult[]> {
    try {
      const queueKey = this.STORAGE_KEYS.SCAN_QUEUE;
      const queueData = await AsyncStorage.getItem(queueKey);
      
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Failed to get queued scans:', error);
      return [];
    }
  }

  /**
   * Clear all cached data
   */
  static async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith(this.STORAGE_KEYS.CACHED_TICKETS) ||
        key === this.STORAGE_KEYS.SCAN_QUEUE ||
        key === this.STORAGE_KEYS.SCANNED_TICKETS ||
        key === this.STORAGE_KEYS.LAST_SYNC
      );

      await AsyncStorage.multiRemove(cacheKeys);
      console.log('Cleared all offline cache');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    cachedEvents: number;
    totalCachedTickets: number;
    queuedScans: number;
    scannedTickets: number;
    lastSync: Date | null;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.STORAGE_KEYS.CACHED_TICKETS));
      
      let totalCachedTickets = 0;
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const cache = JSON.parse(data);
          totalCachedTickets += cache.tickets?.length || 0;
        }
      }

      const queuedScans = await this.getQueuedScans();
      const scannedData = await AsyncStorage.getItem(this.STORAGE_KEYS.SCANNED_TICKETS);
      const scannedTickets = scannedData ? JSON.parse(scannedData).length : 0;
      
      const lastSyncData = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
      const lastSync = lastSyncData ? new Date(parseInt(lastSyncData)) : null;

      return {
        cachedEvents: cacheKeys.length,
        totalCachedTickets,
        queuedScans: queuedScans.length,
        scannedTickets,
        lastSync,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        cachedEvents: 0,
        totalCachedTickets: 0,
        queuedScans: 0,
        scannedTickets: 0,
        lastSync: null,
      };
    }
  }

  /**
   * Private helper methods
   */
  private static async isOnline(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected === true;
    } catch (error) {
      return false;
    }
  }

  private static async findTicketInCache(ticketId: string, eventId: string): Promise<Ticket | null> {
    try {
      const cacheKey = `${this.STORAGE_KEYS.CACHED_TICKETS}_${eventId}`;
      const cacheData = await AsyncStorage.getItem(cacheKey);
      
      if (!cacheData) {
        return null;
      }

      const cache = JSON.parse(cacheData);
      
      // Check if cache is expired
      if (Date.now() > cache.expiry) {
        return null;
      }

      const ticket = cache.tickets?.find((t: Ticket) => t.id === ticketId);
      return ticket || null;
    } catch (error) {
      console.error('Failed to find ticket in cache:', error);
      return null;
    }
  }

  private static generateScanId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static async cleanupExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.STORAGE_KEYS.CACHED_TICKETS));
      
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const cache = JSON.parse(data);
          if (Date.now() > cache.expiry) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup expired cache:', error);
    }
  }
}

export { OfflineQRService };