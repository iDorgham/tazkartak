export interface Venue {
  id: string;
  userId: string;
  name: string;
  location: string;
  capacity: number;
  contactEmail?: string;
  contactPhone?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  events?: Event[];
}

export interface CreateVenueInput {
  name: string;
  location: string;
  capacity: number;
  contactEmail?: string;
  contactPhone?: string;
  imageUrl?: string;
}

export interface UpdateVenueInput {
  name?: string;
  location?: string;
  capacity?: number;
  contactEmail?: string;
  contactPhone?: string;
  imageUrl?: string;
}

export interface VenueFilters {
  search?: string;
  location?: string;
  minCapacity?: number;
  maxCapacity?: number;
  page?: number;
  limit?: number;
}

export interface VenueStats {
  totalVenues: number;
  totalCapacity: number;
  averageCapacity: number;
  venuesWithEvents: number;
  totalEvents: number;
}

export interface VenueAnalytics {
  venueId: string;
  venueName: string;
  totalEvents: number;
  totalCapacity: number;
  averageOccupancy: number;
  revenue: number;
  eventsByMonth: Array<{
    month: string;
    events: number;
    revenue: number;
  }>;
  topEventTypes: Array<{
    type: string;
    count: number;
    revenue: number;
  }>;
}

export interface VenueAvailability {
  venueId: string;
  date: string;
  isAvailable: boolean;
  conflictingEvents?: Array<{
    eventId: string;
    title: string;
    startTime: string;
    endTime: string;
  }>;
}

export interface VenueBookingRequest {
  venueId: string;
  eventId: string;
  startDate: string;
  endDate: string;
  expectedCapacity: number;
  specialRequirements?: string;
}

export interface VenueBookingResponse {
  bookingId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message: string;
  bookingDetails?: {
    venueId: string;
    eventId: string;
    startDate: string;
    endDate: string;
    capacity: number;
    price: number;
  };
}

// Import from other types (to avoid circular dependencies)
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  capacity: number;
  status: string;
}
