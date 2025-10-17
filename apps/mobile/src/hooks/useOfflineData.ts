import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { offlineDataService } from '@/services/offline-data.service';
import { OfflineDataOptions, OfflineQueryOptions } from '@/services/offline-storage.service';

export interface UseOfflineDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isOffline: boolean;
  lastUpdated: number;
}

export interface UseOfflineDataListResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isOffline: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useOfflineData<T>(
  type: string,
  id: string,
  options: OfflineDataOptions = {}
): UseOfflineDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);

  const { isOnline } = useSelector((state: RootState) => state.offline);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await offlineDataService.getData<T>(type, id, {
        ...options,
        forceRefresh: options.forceRefresh || false,
      });

      setData(result);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [type, id, options, isOnline]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isOffline: !isOnline,
    lastUpdated,
  };
}

export function useOfflineDataList<T>(
  type: string,
  options: OfflineQueryOptions = {}
): UseOfflineDataListResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const { isOnline } = useSelector((state: RootState) => state.offline);

  const fetchData = useCallback(async (resetOffset = false) => {
    try {
      if (resetOffset) {
        setLoading(true);
        setOffset(0);
      }

      setError(null);

      const currentOffset = resetOffset ? 0 : offset;
      const result = await offlineDataService.getDataList<T>(type, {
        ...options,
        offset: currentOffset,
        limit: options.limit || 20,
      });

      if (resetOffset) {
        setData(result);
      } else {
        setData(prev => [...prev, ...result]);
      }

      setOffset(currentOffset + result.length);
      setHasMore(result.length === (options.limit || 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [type, options, offset, isOnline]);

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchData(false);
    }
  }, [fetchData, loading, hasMore]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    isOffline: !isOnline,
    hasMore,
    loadMore,
  };
}

// Specialized hooks for different data types
export function useOfflineEvents(options: OfflineQueryOptions = {}) {
  return useOfflineDataList('events', options);
}

export function useOfflineEvent(id: string, options: OfflineDataOptions = {}) {
  return useOfflineData('events', id, options);
}

export function useOfflineTickets(options: OfflineQueryOptions = {}) {
  return useOfflineDataList('tickets', options);
}

export function useOfflineTicket(id: string, options: OfflineDataOptions = {}) {
  return useOfflineData('tickets', id, options);
}

export function useOfflineVenues(options: OfflineQueryOptions = {}) {
  return useOfflineDataList('venues', options);
}

export function useOfflineVenue(id: string, options: OfflineDataOptions = {}) {
  return useOfflineData('venues', id, options);
}

export function useOfflinePayments(options: OfflineQueryOptions = {}) {
  return useOfflineDataList('payments', options);
}

export function useOfflinePayment(id: string, options: OfflineDataOptions = {}) {
  return useOfflineData('payments', id, options);
}

// CRUD operations hook
export function useOfflineCrud<T>(
  type: string,
  options: { syncImmediately?: boolean } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useSelector((state: RootState) => state.offline);

  const create = useCallback(async (data: any): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      const result = await offlineDataService.createData<T>(type, data, options);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [type, options]);

  const update = useCallback(async (id: string, data: any): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      const result = await offlineDataService.updateData<T>(type, id, data, options);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [type, options]);

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await offlineDataService.deleteData(type, id, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [type, options]);

  return {
    create,
    update,
    remove,
    loading,
    error,
    isOffline: !isOnline,
  };
}

// Search hook
export function useOfflineSearch<T>(
  type: string,
  query: string,
  fields: string[],
  options: OfflineQueryOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isOnline } = useSelector((state: RootState) => state.offline);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await offlineDataService.searchData<T>(
        type,
        searchQuery,
        fields,
        options
      );

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [type, fields, options, isOnline]);

  useEffect(() => {
    if (query) {
      search(query);
    }
  }, [search, query]);

  return {
    data,
    loading,
    error,
    search,
    isOffline: !isOnline,
  };
}

// Cache management hook
export function useOfflineCache() {
  const [cacheStats, setCacheStats] = useState({
    totalItems: 0,
    cacheSize: 0,
    pendingSync: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchCacheStats = useCallback(async () => {
    try {
      setLoading(true);
      const stats = await offlineDataService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(async (type?: string) => {
    try {
      setLoading(true);
      await offlineDataService.clearCache(type);
      await fetchCacheStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchCacheStats]);

  const preloadData = useCallback(async (type: string, ids?: string[]) => {
    try {
      setLoading(true);
      await offlineDataService.preloadData(type, ids);
      await fetchCacheStats();
    } catch (error) {
      console.error('Failed to preload data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchCacheStats]);

  useEffect(() => {
    fetchCacheStats();
  }, [fetchCacheStats]);

  return {
    cacheStats,
    loading,
    clearCache,
    preloadData,
    refreshStats: fetchCacheStats,
  };
}

