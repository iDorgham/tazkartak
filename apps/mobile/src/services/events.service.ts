import { apiService } from './api.service';
import { cacheService } from './cache.service';
import { offlineService } from './offline.service';
import { API_ENDPOINTS, CACHE_CONFIG } from '@/utils/constants';
import { Event, EventFilters, EventAnalytics, CreateEventInput, UpdateEventInput } from '@/types/event.types';
import { PaginatedResponse, ApiResponse } from '@/types/api.types';
import NetInfo from '@react-native-community/netinfo';

class EventsService {
  async getEvents(filters: EventFilters = {}): Promise<PaginatedResponse<Event>> {
    const isConnected = await this.isOnline();
    
    if (isConnected) {
      try {
        const response = await apiService.get<PaginatedResponse<Event>>(API_ENDPOINTS.EVENTS.LIST, {
          params: filters,
        });
        
        // Cache the results
        await cacheService.setEvents(response.data.data);
        
        return response.data;
      } catch (error) {
        // If API fails, try to return cached data
        const cachedEvents = await this.getCachedEvents(filters);
        if (cachedEvents) {
          return cachedEvents;
        }
        throw error;
      }
    } else {
      // Return cached data when offline
      const cachedEvents = await this.getCachedEvents(filters);
      if (cachedEvents) {
        return cachedEvents;
      }
      throw new Error('No cached events available and device is offline');
    }
  }

  async getEventById(eventId: string): Promise<ApiResponse<Event>> {
    const isConnected = await this.isOnline();
    
    if (isConnected) {
      try {
        const url = API_ENDPOINTS.EVENTS.DETAIL.replace(':id', eventId);
        const response = await apiService.get<ApiResponse<Event>>(url);
        
        // Cache the individual event
        await cacheService.setEvent(eventId, response.data.data);
        
        return response.data;
      } catch (error) {
        // Try cached data if API fails
        const cachedEvent = await cacheService.getEvent(eventId);
        if (cachedEvent) {
          return { data: cachedEvent, success: true };
        }
        throw error;
      }
    } else {
      // Return cached data when offline
      const cachedEvent = await cacheService.getEvent(eventId);
      if (cachedEvent) {
        return { data: cachedEvent, success: true };
      }
      throw new Error('Event not found in cache and device is offline');
    }
  }

  async createEvent(eventData: CreateEventInput): Promise<ApiResponse<Event>> {
    const isConnected = await this.isOnline();
    
    if (isConnected) {
      try {
        const response = await apiService.post<ApiResponse<Event>>(API_ENDPOINTS.EVENTS.CREATE, eventData);
        
        // Cache the created event
        await cacheService.setEvent(response.data.data.id, response.data.data);
        
        return response.data;
      } catch (error) {
        // If online but API fails, add to offline queue
        await offlineService.performOptimisticUpdate(
          'CREATE_EVENT',
          eventData,
          { ...eventData, id: `temp_${Date.now()}`, status: 'DRAFT' },
          'high'
        );
        throw error;
      }
    } else {
      // Offline - add to queue and return optimistic data
      const optimisticEvent = {
        ...eventData,
        id: `temp_${Date.now()}`,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
      };
      
      await offlineService.performOptimisticUpdate(
        'CREATE_EVENT',
        eventData,
        optimisticEvent,
        'high'
      );
      
      return { data: optimisticEvent, success: true };
    }
  }

  async updateEvent(eventId: string, eventData: UpdateEventInput): Promise<ApiResponse<Event>> {
    const url = API_ENDPOINTS.EVENTS.UPDATE.replace(':id', eventId);
    const response = await apiService.put<ApiResponse<Event>>(url, eventData);
    return response.data;
  }

  async deleteEvent(eventId: string): Promise<void> {
    const url = API_ENDPOINTS.EVENTS.DELETE.replace(':id', eventId);
    await apiService.delete(url);
  }

  async searchEvents(query: string, filters: Partial<EventFilters> = {}): Promise<PaginatedResponse<Event>> {
    const response = await apiService.get<PaginatedResponse<Event>>(API_ENDPOINTS.EVENTS.SEARCH, {
      params: {
        search: query,
        ...filters,
      },
    });
    return response.data;
  }

  async getEventAnalytics(eventId: string): Promise<ApiResponse<EventAnalytics>> {
    const url = API_ENDPOINTS.EVENTS.ANALYTICS.replace(':id', eventId);
    const response = await apiService.get<ApiResponse<EventAnalytics>>(url);
    return response.data;
  }

  async getEventAttendees(eventId: string): Promise<ApiResponse<any[]>> {
    const url = API_ENDPOINTS.EVENTS.ATTENDEES.replace(':id', eventId);
    const response = await apiService.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async uploadEventImage(eventId: string, imageFile: any): Promise<ApiResponse<{ imageUrl: string }>> {
    const url = `${API_ENDPOINTS.EVENTS.UPDATE.replace(':id', eventId)}/image`;
    const response = await apiService.uploadFile<ApiResponse<{ imageUrl: string }>>(url, imageFile);
    return response.data;
  }

  async addToFavorites(eventId: string): Promise<void> {
    await apiService.post(`${API_ENDPOINTS.EVENTS.DETAIL.replace(':id', eventId)}/favorite`);
  }

  async removeFromFavorites(eventId: string): Promise<void> {
    await apiService.delete(`${API_ENDPOINTS.EVENTS.DETAIL.replace(':id', eventId)}/favorite`);
  }

  async getFavoriteEvents(): Promise<PaginatedResponse<Event>> {
    const response = await apiService.get<PaginatedResponse<Event>>('/events/favorites');
    return response.data;
  }

  async getMyEvents(filters: Partial<EventFilters> = {}): Promise<PaginatedResponse<Event>> {
    const response = await apiService.get<PaginatedResponse<Event>>('/events/my', {
      params: filters,
    });
    return response.data;
  }

  async publishEvent(eventId: string): Promise<ApiResponse<Event>> {
    const url = `${API_ENDPOINTS.EVENTS.UPDATE.replace(':id', eventId)}/publish`;
    const response = await apiService.post<ApiResponse<Event>>(url);
    return response.data;
  }

  async unpublishEvent(eventId: string): Promise<ApiResponse<Event>> {
    const url = `${API_ENDPOINTS.EVENTS.UPDATE.replace(':id', eventId)}/unpublish`;
    const response = await apiService.post<ApiResponse<Event>>(url);
    return response.data;
  }

  async cancelEvent(eventId: string, reason?: string): Promise<ApiResponse<Event>> {
    const url = `${API_ENDPOINTS.EVENTS.UPDATE.replace(':id', eventId)}/cancel`;
    const response = await apiService.post<ApiResponse<Event>>(url, { reason });
    return response.data;
  }

  async duplicateEvent(eventId: string): Promise<ApiResponse<Event>> {
    const url = `${API_ENDPOINTS.EVENTS.DETAIL.replace(':id', eventId)}/duplicate`;
    const response = await apiService.post<ApiResponse<Event>>(url);
    return response.data;
  }

  async getEventStats(): Promise<ApiResponse<any>> {
    const response = await apiService.get<ApiResponse<any>>('/events/stats');
    return response.data;
  }

  async exportEventData(eventId: string, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const url = `${API_ENDPOINTS.EVENTS.DETAIL.replace(':id', eventId)}/export`;
    const response = await apiService.get(url, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  async getNearbyEvents(latitude: number, longitude: number, radius: number = 10): Promise<PaginatedResponse<Event>> {
    const response = await apiService.get<PaginatedResponse<Event>>('/events/nearby', {
      params: {
        latitude,
        longitude,
        radius,
      },
    });
    return response.data;
  }

  async getTrendingEvents(): Promise<PaginatedResponse<Event>> {
    const response = await apiService.get<PaginatedResponse<Event>>('/events/trending');
    return response.data;
  }

  async getFeaturedEvents(): Promise<PaginatedResponse<Event>> {
    const response = await apiService.get<PaginatedResponse<Event>>('/events/featured');
    return response.data;
  }

  async getEventsByCategory(category: string, filters: Partial<EventFilters> = {}): Promise<PaginatedResponse<Event>> {
    const response = await apiService.get<PaginatedResponse<Event>>(`/events/category/${category}`, {
      params: filters,
    });
    return response.data;
  }

  async getEventsByDateRange(startDate: string, endDate: string, filters: Partial<EventFilters> = {}): Promise<PaginatedResponse<Event>> {
    const response = await apiService.get<PaginatedResponse<Event>>('/events/date-range', {
      params: {
        startDate,
        endDate,
        ...filters,
      },
    });
    return response.data;
  }

  // Offline helper methods
  private async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  private async getCachedEvents(filters: EventFilters = {}): Promise<PaginatedResponse<Event> | null> {
    try {
      const cachedEvents = await cacheService.getEvents();
      if (!cachedEvents) {
        return null;
      }

      // Apply filters to cached data
      let filteredEvents = [...cachedEvents];

      // Filter by category
      if (filters.category) {
        filteredEvents = filteredEvents.filter(event => event.category === filters.category);
      }

      // Filter by date range
      if (filters.startDate) {
        filteredEvents = filteredEvents.filter(event => 
          new Date(event.startDate) >= new Date(filters.startDate!)
        );
      }

      if (filters.endDate) {
        filteredEvents = filteredEvents.filter(event => 
          new Date(event.endDate) <= new Date(filters.endDate!)
        );
      }

      // Filter by status
      if (filters.status) {
        filteredEvents = filteredEvents.filter(event => event.status === filters.status);
      }

      // Filter by price range
      if (filters.minPrice !== undefined) {
        filteredEvents = filteredEvents.filter(event => 
          event.ticketTypes.some(ticket => ticket.price >= filters.minPrice!)
        );
      }

      if (filters.maxPrice !== undefined) {
        filteredEvents = filteredEvents.filter(event => 
          event.ticketTypes.some(ticket => ticket.price <= filters.maxPrice!)
        );
      }

      // Filter by location
      if (filters.location) {
        filteredEvents = filteredEvents.filter(event => 
          event.venue?.address?.toLowerCase().includes(filters.location!.toLowerCase()) ||
          event.venue?.name?.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }

      // Sort events
      const sortBy = filters.sortBy || 'startDate';
      const sortOrder = filters.sortOrder || 'asc';
      
      filteredEvents.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Event];
        let bValue: any = b[sortBy as keyof Event];

        // Handle nested properties
        if (sortBy === 'venue.name') {
          aValue = a.venue?.name;
          bValue = b.venue?.name;
        }

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Paginate results
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

      return {
        data: paginatedEvents,
        pagination: {
          page,
          limit,
          total: filteredEvents.length,
          totalPages: Math.ceil(filteredEvents.length / limit),
        },
      };
    } catch (error) {
      console.error('Error getting cached events:', error);
      return null;
    }
  }

  // Search in cached events
  async searchCachedEvents(query: string, filters: Partial<EventFilters> = {}): Promise<PaginatedResponse<Event>> {
    try {
      const cachedEvents = await cacheService.getEvents();
      if (!cachedEvents) {
        throw new Error('No cached events available');
      }

      // Search in title, description, venue name, and category
      const searchQuery = query.toLowerCase();
      let filteredEvents = cachedEvents.filter(event => 
        event.title.toLowerCase().includes(searchQuery) ||
        event.description?.toLowerCase().includes(searchQuery) ||
        event.venue?.name?.toLowerCase().includes(searchQuery) ||
        event.category.toLowerCase().includes(searchQuery)
      );

      // Apply additional filters
      if (filters.category) {
        filteredEvents = filteredEvents.filter(event => event.category === filters.category);
      }

      if (filters.status) {
        filteredEvents = filteredEvents.filter(event => event.status === filters.status);
      }

      // Paginate results
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

      return {
        data: paginatedEvents,
        pagination: {
          page,
          limit,
          total: filteredEvents.length,
          totalPages: Math.ceil(filteredEvents.length / limit),
        },
      };
    } catch (error) {
      console.error('Error searching cached events:', error);
      throw error;
    }
  }

  // Get events by favorites (offline)
  async getCachedFavoriteEvents(): Promise<Event[]> {
    try {
      const cachedEvents = await cacheService.getEvents();
      if (!cachedEvents) {
        return [];
      }

      // For offline, we'll use a simple approach
      // In a real app, you'd store favorite event IDs separately
      return cachedEvents.filter(event => 
        event.title.toLowerCase().includes('favorite') ||
        event.category.toLowerCase().includes('favorite')
      );
    } catch (error) {
      console.error('Error getting cached favorite events:', error);
      return [];
    }
  }

  // Clear cache
  async clearEventCache(): Promise<void> {
    await cacheService.clearByPattern(/^events?:|^event:/);
  }

  // Get cache statistics
  getCacheStats() {
    return cacheService.getStats();
  }
}

export const eventsService = new EventsService();

