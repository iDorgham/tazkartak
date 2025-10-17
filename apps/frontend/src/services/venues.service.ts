import { api } from './api.service';

export interface Venue {
  id: string;
  name: string;
  description?: string;
  location: string;
  address: string;
  city: string;
  capacity: number;
  amenities: string[];
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  images: string[];
  latitude?: number;
  longitude?: number;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  isVerified: boolean;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    contactEmail: string;
  };
  _count: {
    events: number;
  };
  events?: Array<{
    id: string;
    name: string;
    startDate: Date;
    status: string;
  }>;
}

export interface CreateVenueData {
  name: string;
  description?: string;
  location: string;
  address: string;
  city: string;
  capacity: number;
  amenities: string[];
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  images?: string[];
  latitude?: number;
  longitude?: number;
}

export interface UpdateVenueData {
  name?: string;
  description?: string;
  location?: string;
  address?: string;
  city?: string;
  capacity?: number;
  amenities?: string[];
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  images?: string[];
  latitude?: number;
  longitude?: number;
  status?: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
}

export interface VenueFilters {
  search?: string;
  city?: string;
  status?: string;
  minCapacity?: number;
  maxCapacity?: number;
  amenities?: string[];
  ownerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'capacity' | 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface VenuesResponse {
  venues: Venue[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VenueStats {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  totalRevenue: number;
  averageAttendance: number;
  occupancyRate: number;
}

export interface VenueVerificationData {
  isVerified: boolean;
  verificationNotes?: string;
}

class VenuesService {
  /**
   * Create a new venue
   */
  async createVenue(data: CreateVenueData): Promise<Venue> {
    const response = await api.post('/venues', data);
    return response.data.data;
  }

  /**
   * Get all venues with filtering
   */
  async getVenues(filters: VenueFilters = {}): Promise<VenuesResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/venues?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Get verified venues (for organizers to select)
   */
  async getVerifiedVenues(filters: Omit<VenueFilters, 'status'> = {}): Promise<VenuesResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/venues/verified?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Get venues pending verification (for admin)
   */
  async getPendingVerificationVenues(filters: Omit<VenueFilters, 'status'> = {}): Promise<VenuesResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/venues/admin/pending-verification?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Get venue by ID
   */
  async getVenueById(id: string): Promise<Venue> {
    const response = await api.get(`/venues/${id}`);
    return response.data.data;
  }

  /**
   * Update a venue
   */
  async updateVenue(id: string, data: UpdateVenueData): Promise<Venue> {
    const response = await api.put(`/venues/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete a venue
   */
  async deleteVenue(id: string): Promise<void> {
    await api.delete(`/venues/${id}`);
  }

  /**
   * Verify a venue (Admin only)
   */
  async verifyVenue(id: string, verificationData: VenueVerificationData): Promise<Venue> {
    const response = await api.post(`/venues/${id}/verify`, verificationData);
    return response.data.data;
  }

  /**
   * Get venues by owner
   */
  async getVenuesByOwner(filters: Omit<VenueFilters, 'ownerId'> = {}): Promise<VenuesResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/venues/owner/my-venues?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Get venue statistics
   */
  async getVenueStats(venueId: string): Promise<VenueStats> {
    const response = await api.get(`/venues/${venueId}/stats`);
    return response.data.data;
  }

  /**
   * Search venues by location
   */
  async searchVenuesByLocation(query: string, limit: number = 10): Promise<{ venues: Venue[]; total: number }> {
    const response = await api.get(`/venues/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data.data;
  }

  /**
   * Get available amenities
   */
  async getAvailableAmenities(): Promise<string[]> {
    const response = await api.get('/venues/amenities');
    return response.data.data;
  }

  /**
   * Get cities with venues
   */
  async getCitiesWithVenues(): Promise<string[]> {
    const response = await api.get('/venues/cities');
    return response.data.data;
  }

  /**
   * Upload venue images
   */
  async uploadVenueImages(venueId: string, files: File[]): Promise<{ venueId: string; imageUrls: string[] }> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`image_${index}`, file);
    });

    const response = await api.post(`/venues/${venueId}/upload-images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  /**
   * Get nearby venues
   */
  async getNearbyVenues(latitude: number, longitude: number, radius: number = 10): Promise<Venue[]> {
    // This would typically use a geospatial query
    // For now, we'll return verified venues
    const response = await this.getVerifiedVenues({ limit: 20 });
    return response.venues;
  }

  /**
   * Get venues by capacity range
   */
  async getVenuesByCapacity(minCapacity: number, maxCapacity?: number): Promise<VenuesResponse> {
    return this.getVerifiedVenues({
      minCapacity,
      maxCapacity,
    });
  }

  /**
   * Get venues by amenities
   */
  async getVenuesByAmenities(amenities: string[]): Promise<VenuesResponse> {
    return this.getVerifiedVenues({
      amenities,
    });
  }

  /**
   * Get featured venues
   */
  async getFeaturedVenues(limit: number = 6): Promise<VenuesResponse> {
    return this.getVerifiedVenues({
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  /**
   * Get popular venues (by event count)
   */
  async getPopularVenues(limit: number = 6): Promise<VenuesResponse> {
    return this.getVerifiedVenues({
      limit,
      sortBy: 'rating', // Assuming rating is based on event count
      sortOrder: 'desc',
    });
  }

  /**
   * Get venue availability for date range
   */
  async getVenueAvailability(venueId: string, startDate: Date, endDate: Date): Promise<{
    available: boolean;
    conflictingEvents: Array<{
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
    }>;
  }> {
    // This would typically check for conflicting events
    // For now, we'll return a placeholder
    return {
      available: true,
      conflictingEvents: [],
    };
  }

  /**
   * Calculate venue rating
   */
  async getVenueRating(venueId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: {
      [key: string]: number;
    };
  }> {
    // This would typically calculate from reviews/ratings
    // For now, we'll return a placeholder
    return {
      averageRating: 4.5,
      totalReviews: 12,
      ratingBreakdown: {
        '5': 8,
        '4': 3,
        '3': 1,
        '2': 0,
        '1': 0,
      },
    };
  }
}

export const venuesService = new VenuesService();