export interface Event {
  id: string;
  organizerId: string;
  venueId?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  price: number;
  status: EventStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  organizer?: Organizer;
  venue?: Venue;
  tickets?: Ticket[];
  ticketsSold?: number;
  ticketsAvailable?: number;
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export interface CreateEventInput {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  venueId?: string;
  capacity: number;
  price: number;
  imageUrl?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  venueId?: string;
  capacity?: number;
  price?: number;
  status?: EventStatus;
  imageUrl?: string;
}

export interface EventFilters {
  status?: EventStatus;
  organizerId?: string;
  venueId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface EventStats {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  cancelledEvents: number;
  completedEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
}

export interface EventAnalytics {
  eventId: string;
  eventTitle: string;
  ticketsSold: number;
  totalRevenue: number;
  conversionRate: number;
  topSellingDays: Array<{
    date: string;
    ticketsSold: number;
    revenue: number;
  }>;
  demographics: {
    ageGroups: Array<{
      ageGroup: string;
      count: number;
      percentage: number;
    }>;
    locations: Array<{
      location: string;
      count: number;
      percentage: number;
    }>;
  };
}

// Import from other types (to avoid circular dependencies)
interface Organizer {
  id: string;
  name: string;
  description?: string;
}

interface Venue {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  price: number;
  status: string;
  createdAt: string;
}
