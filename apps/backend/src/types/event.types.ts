export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EventCategory {
  MUSIC = 'MUSIC',
  SPORTS = 'SPORTS',
  CONFERENCE = 'CONFERENCE',
  EXHIBITION = 'EXHIBITION',
  WORKSHOP = 'WORKSHOP',
  FESTIVAL = 'FESTIVAL',
  WEDDING = 'WEDDING',
  CORPORATE = 'CORPORATE',
  EDUCATION = 'EDUCATION',
  OTHER = 'OTHER',
}

export interface Event {
  id: string;
  organizerId: string;
  venueId: string;
  name: string;
  description: string;
  category: EventCategory;
  startDate: Date;
  endDate: Date;
  capacity: number;
  price: number;
  currency: string;
  status: EventStatus;
  imageUrl?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  organizer?: any;
  venue?: any;
  tickets?: any[];
}

export interface CreateEventRequest {
  name: string;
  description: string;
  category: EventCategory;
  venueId: string;
  startDate: string;
  endDate: string;
  capacity: number;
  price: number;
  currency?: string;
  imageUrl?: string;
  isPublic?: boolean;
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  category?: EventCategory;
  venueId?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  price?: number;
  currency?: string;
  imageUrl?: string;
  isPublic?: boolean;
  status?: EventStatus;
}

export interface EventFilters {
  category?: EventCategory;
  status?: EventStatus;
  dateFrom?: string;
  dateTo?: string;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EventResponse {
  success: boolean;
  message: string;
  data: {
    events: Event[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}
