import { apiService } from './api.service';
import { API_ENDPOINTS } from '@/utils/constants';
import { Venue, CreateVenueInput, UpdateVenueInput, VenueFilters } from '@/types/venue.types';
import { PaginatedResponse, ApiResponse } from '@/types/api.types';

class VenuesService {
  async getVenues(filters: VenueFilters = {}): Promise<PaginatedResponse<Venue>> {
    const response = await apiService.get<PaginatedResponse<Venue>>(API_ENDPOINTS.VENUES.LIST, {
      params: filters,
    });
    return response.data;
  }

  async getMyVenues(): Promise<ApiResponse<Venue[]>> {
    const response = await apiService.get<ApiResponse<Venue[]>>('/venues/my');
    return response.data;
  }

  async getVenueById(venueId: string): Promise<ApiResponse<Venue>> {
    const url = API_ENDPOINTS.VENUES.DETAIL.replace(':id', venueId);
    const response = await apiService.get<ApiResponse<Venue>>(url);
    return response.data;
  }

  async createVenue(venueData: CreateVenueInput): Promise<ApiResponse<Venue>> {
    const response = await apiService.post<ApiResponse<Venue>>(API_ENDPOINTS.VENUES.CREATE, venueData);
    return response.data;
  }

  async updateVenue(venueId: string, venueData: UpdateVenueInput): Promise<ApiResponse<Venue>> {
    const url = API_ENDPOINTS.VENUES.UPDATE.replace(':id', venueId);
    const response = await apiService.put<ApiResponse<Venue>>(url, venueData);
    return response.data;
  }

  async deleteVenue(venueId: string): Promise<void> {
    const url = API_ENDPOINTS.VENUES.DELETE.replace(':id', venueId);
    await apiService.delete(url);
  }

  async searchVenues(query: string): Promise<PaginatedResponse<Venue>> {
    const response = await apiService.get<PaginatedResponse<Venue>>('/venues/search', {
      params: { search: query },
    });
    return response.data;
  }

  async verifyVenue(venueId: string, isVerified: boolean, notes?: string): Promise<ApiResponse<Venue>> {
    const url = API_ENDPOINTS.VENUES.VERIFY.replace(':id', venueId);
    const response = await apiService.post<ApiResponse<Venue>>(url, { isVerified, notes });
    return response.data;
  }

  async getVenueTeam(venueId: string): Promise<ApiResponse<any[]>> {
    const url = API_ENDPOINTS.VENUES.TEAM.replace(':id', venueId);
    const response = await apiService.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async addTeamMember(venueId: string, userData: any): Promise<ApiResponse<any>> {
    const url = `${API_ENDPOINTS.VENUES.TEAM.replace(':id', venueId)}/add`;
    const response = await apiService.post<ApiResponse<any>>(url, userData);
    return response.data;
  }

  async removeTeamMember(venueId: string, userId: string): Promise<void> {
    const url = `${API_ENDPOINTS.VENUES.TEAM.replace(':id', venueId)}/remove`;
    await apiService.delete(url, { params: { userId } });
  }

  async updateTeamMemberPermissions(venueId: string, userId: string, permissions: string[]): Promise<ApiResponse<any>> {
    const url = `${API_ENDPOINTS.VENUES.TEAM.replace(':id', venueId)}/permissions`;
    const response = await apiService.put<ApiResponse<any>>(url, { userId, permissions });
    return response.data;
  }

  async getVenueAnalytics(venueId: string): Promise<ApiResponse<any>> {
    const url = `${API_ENDPOINTS.VENUES.DETAIL.replace(':id', venueId)}/analytics`;
    const response = await apiService.get<ApiResponse<any>>(url);
    return response.data;
  }

  async uploadVenueImages(venueId: string, images: any[]): Promise<ApiResponse<{ imageUrls: string[] }>> {
    const url = `${API_ENDPOINTS.VENUES.UPDATE.replace(':id', venueId)}/images`;
    const response = await apiService.uploadFiles<ApiResponse<{ imageUrls: string[] }>>(url, images);
    return response.data;
  }

  async getNearbyVenues(latitude: number, longitude: number, radius: number = 10): Promise<PaginatedResponse<Venue>> {
    const response = await apiService.get<PaginatedResponse<Venue>>('/venues/nearby', {
      params: { latitude, longitude, radius },
    });
    return response.data;
  }

  async getVenueEvents(venueId: string): Promise<PaginatedResponse<any>> {
    const url = `${API_ENDPOINTS.VENUES.DETAIL.replace(':id', venueId)}/events`;
    const response = await apiService.get<PaginatedResponse<any>>(url);
    return response.data;
  }
}

export const venuesService = new VenuesService();

