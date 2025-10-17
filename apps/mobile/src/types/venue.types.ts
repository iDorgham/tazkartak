export interface Venue {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  amenities: string[];
  images: string[];
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  website?: string;
  isVerified: boolean;
  verificationNotes?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  events?: Event[];
}

export interface CreateVenueInput {
  name: string;
  description?: string;
  address: string;
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  amenities?: string[];
  images?: string[];
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  website?: string;
}

export interface UpdateVenueInput {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  amenities?: string[];
  images?: string[];
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
}

export interface VenueFilters {
  city?: string;
  country?: string;
  capacityMin?: number;
  capacityMax?: number;
  isVerified?: boolean;
  amenities?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface VenueAnalytics {
  totalVenues: number;
  verifiedVenues: number;
  pendingVerification: number;
  totalCapacity: number;
  averageCapacity: number;
  popularAmenities: Array<{
    amenity: string;
    count: number;
    percentage: number;
  }>;
  venuesByCity: Array<{
    city: string;
    count: number;
    percentage: number;
  }>;
}

// Import from other types (to avoid circular dependencies)
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
}

