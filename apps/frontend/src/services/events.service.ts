import { api } from './api.service';

export interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  venueId?: string;
  category: string;
  capacity: number;
  imageUrl?: string;
  isPublic: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  organizerId: string;
  createdAt: string;
  updatedAt: string;
  organizer: {
    id: string;
    name: string;
    contactEmail: string;
  };
  venue?: {
    id: string;
    name: string;
    location: string;
    capacity: number;
  };
  ticketTypes: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    sold: number;
    description?: string;
  }>;
  _count: {
    tickets: number;
  };
}

export interface CreateEventData {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  venueId?: string;
  category: string;
  capacity: number;
  ticketTypes: Array<{
    name: string;
    price: number;
    quantity: number;
    description?: string;
  }>;
  imageUrl?: string;
  isPublic: boolean;
}

export interface UpdateEventData {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  venueId?: string;
  category?: string;
  capacity?: number;
  ticketTypes?: Array<{
    id?: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
  }>;
  imageUrl?: string;
  isPublic?: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface EventFilters {
  search?: string;
  category?: string;
  status?: string;
  organizerId?: string;
  venueId?: string;
  startDate?: Date;
  endDate?: Date;
  isPublic?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'startDate' | 'createdAt' | 'capacity';
  sortOrder?: 'asc' | 'desc';
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventStats {
  totalTickets: number;
  soldTickets: number;
  availableTickets: number;
  totalRevenue: number;
  ticketTypeStats: Array<{
    name: string;
    total: number;
    sold: number;
    available: number;
    revenue: number;
  }>;
}

class EventsService {
  /**
   * Create a new event
   */
  async createEvent(data: CreateEventData): Promise<Event> {
    const response = await api.post('/events', data);
    return response.data.data;
  }

  /**
   * Get all events with filtering
   */
  async getEvents(filters: EventFilters = {}): Promise<EventsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/events?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Get public events (for buyers)
   */
  async getPublicEvents(filters: Omit<EventFilters, 'isPublic'> = {}): Promise<EventsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/events/public?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Get event by ID
   */
  async getEventById(id: string): Promise<Event> {
    const response = await api.get(`/events/${id}`);
    return response.data.data;
  }

  /**
   * Update an event
   */
  async updateEvent(id: string, data: UpdateEventData): Promise<Event> {
    const response = await api.put(`/events/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  }

  /**
   * Publish an event
   */
  async publishEvent(id: string): Promise<Event> {
    const response = await api.patch(`/events/${id}/publish`);
    return response.data.data;
  }

  /**
   * Cancel an event
   */
  async cancelEvent(id: string, reason?: string): Promise<Event> {
    const response = await api.patch(`/events/${id}/cancel`, { reason });
    return response.data.data;
  }

  /**
   * Get events by organizer
   */
  async getEventsByOrganizer(filters: Omit<EventFilters, 'organizerId'> = {}): Promise<EventsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/events/organizer/my-events?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Get event statistics
   */
  async getEventStats(eventId: string): Promise<EventStats> {
    const response = await api.get(`/events/${eventId}/stats`);
    return response.data.data;
  }

  /**
   * Get event categories
   */
  async getEventCategories(): Promise<string[]> {
    const response = await api.get('/events/categories');
    return response.data.data;
  }

  /**
   * Search events
   */
  async searchEvents(query: string, limit: number = 10): Promise<EventsResponse> {
    const response = await api.get(`/events/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data.data;
  }

  /**
   * Upload event image
   */
  async uploadEventImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/events/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit: number = 6): Promise<EventsResponse> {
    const now = new Date();
    return this.getPublicEvents({
      startDate: now,
      limit,
      sortBy: 'startDate',
      sortOrder: 'asc',
    });
  }

  /**
   * Get featured events
   */
  async getFeaturedEvents(limit: number = 6): Promise<EventsResponse> {
    return this.getPublicEvents({
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  /**
   * Get events by category
   */
  async getEventsByCategory(category: string, limit: number = 10): Promise<EventsResponse> {
    return this.getPublicEvents({
      category,
      limit,
      sortBy: 'startDate',
      sortOrder: 'asc',
    });
  }

  /**
   * Get events by venue
   */
  async getEventsByVenue(venueId: string, limit: number = 10): Promise<EventsResponse> {
    return this.getPublicEvents({
      venueId,
      limit,
      sortBy: 'startDate',
      sortOrder: 'asc',
    });
  }
}

export const eventsService = new EventsService();