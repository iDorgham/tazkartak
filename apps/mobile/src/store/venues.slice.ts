import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { venuesService } from '@/services/venues.service';
import { Venue, CreateVenueInput, UpdateVenueInput, VenueFilters } from '@/types/venue.types';
import { PaginatedResponse } from '@/types/api.types';

interface VenuesState {
  venues: Venue[];
  currentVenue: Venue | null;
  favorites: string[];
  filters: VenueFilters;
  filter: 'all' | 'active' | 'inactive';
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    totalVenues: number;
    totalCapacity: number;
    activeEvents: number;
  };
}

const initialState: VenuesState = {
  venues: [],
  currentVenue: null,
  favorites: [],
  filters: {
    page: 1,
    limit: 20,
  },
  filter: 'all',
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasNext: false,
    hasPrev: false,
  },
  stats: {
    totalVenues: 0,
    totalCapacity: 0,
    activeEvents: 0,
  },
};

// Async thunks
export const fetchVenues = createAsyncThunk(
  'venues/fetchVenues',
  async (filters: VenueFilters, { rejectWithValue }) => {
    try {
      const response = await venuesService.getVenues(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch venues');
    }
  }
);

export const fetchVenueById = createAsyncThunk(
  'venues/fetchVenueById',
  async (venueId: string, { rejectWithValue }) => {
    try {
      const response = await venuesService.getVenueById(venueId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch venue');
    }
  }
);

export const createVenue = createAsyncThunk(
  'venues/createVenue',
  async (venueData: CreateVenueInput, { rejectWithValue }) => {
    try {
      const response = await venuesService.createVenue(venueData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create venue');
    }
  }
);

export const updateVenue = createAsyncThunk(
  'venues/updateVenue',
  async ({ venueId, venueData }: { venueId: string; venueData: UpdateVenueInput }, { rejectWithValue }) => {
    try {
      const response = await venuesService.updateVenue(venueId, venueData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update venue');
    }
  }
);

export const deleteVenue = createAsyncThunk(
  'venues/deleteVenue',
  async (venueId: string, { rejectWithValue }) => {
    try {
      await venuesService.deleteVenue(venueId);
      return venueId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete venue');
    }
  }
);

export const fetchMyVenues = createAsyncThunk(
  'venues/fetchMyVenues',
  async (_, { rejectWithValue }) => {
    try {
      const response = await venuesService.getMyVenues();
      return response.data.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my venues');
    }
  }
);

export const searchVenues = createAsyncThunk(
  'venues/searchVenues',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await venuesService.searchVenues(query);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search venues');
    }
  }
);

const venuesSlice = createSlice({
  name: 'venues',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentVenue: (state) => {
      state.currentVenue = null;
    },
    setFilters: (state, action: PayloadAction<Partial<VenueFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 20,
      };
    },
    addToFavorites: (state, action: PayloadAction<string>) => {
      if (!state.favorites.includes(action.payload)) {
        state.favorites.push(action.payload);
      }
    },
    removeFromFavorites: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter(id => id !== action.payload);
    },
    setCurrentVenue: (state, action: PayloadAction<Venue>) => {
      state.currentVenue = action.payload;
    },
    updateVenueInList: (state, action: PayloadAction<Venue>) => {
      const index = state.venues.findIndex(venue => venue.id === action.payload.id);
      if (index !== -1) {
        state.venues[index] = action.payload;
      }
      if (state.currentVenue?.id === action.payload.id) {
        state.currentVenue = action.payload;
      }
    },
    removeVenueFromList: (state, action: PayloadAction<string>) => {
      state.venues = state.venues.filter(venue => venue.id !== action.payload);
      state.favorites = state.favorites.filter(id => id !== action.payload);
      if (state.currentVenue?.id === action.payload) {
        state.currentVenue = null;
      }
    },
    setVenueFilter: (state, action: PayloadAction<'all' | 'active' | 'inactive'>) => {
      state.filter = action.payload;
    },
    updateStats: (state) => {
      state.stats.totalVenues = state.venues.length;
      state.stats.totalCapacity = state.venues.reduce((sum, venue) => sum + venue.capacity, 0);
      state.stats.activeEvents = state.venues.reduce((sum, venue) => sum + (venue.upcomingEventsCount || 0), 0);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Venues
      .addCase(fetchVenues.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVenues.fulfilled, (state, action) => {
        state.isLoading = false;
        const { data, pagination } = action.payload;
        
        if (state.filters.page === 1) {
          state.venues = data;
        } else {
          state.venues = [...state.venues, ...data];
        }
        
        state.pagination = pagination;
      })
      .addCase(fetchVenues.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Venue by ID
      .addCase(fetchVenueById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVenueById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentVenue = action.payload;
      })
      .addCase(fetchVenueById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create Venue
      .addCase(createVenue.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createVenue.fulfilled, (state, action) => {
        state.isCreating = false;
        state.venues.unshift(action.payload);
      })
      .addCase(createVenue.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      })
      
      // Update Venue
      .addCase(updateVenue.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateVenue.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.venues.findIndex(venue => venue.id === action.payload.id);
        if (index !== -1) {
          state.venues[index] = action.payload;
        }
        if (state.currentVenue?.id === action.payload.id) {
          state.currentVenue = action.payload;
        }
      })
      .addCase(updateVenue.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })
      
      // Delete Venue
      .addCase(deleteVenue.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteVenue.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.venues = state.venues.filter(venue => venue.id !== action.payload);
        state.favorites = state.favorites.filter(id => id !== action.payload);
        if (state.currentVenue?.id === action.payload) {
          state.currentVenue = null;
        }
      })
      .addCase(deleteVenue.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      })
      
      // Fetch My Venues
      .addCase(fetchMyVenues.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyVenues.fulfilled, (state, action) => {
        state.isLoading = false;
        state.venues = action.payload;
        // Update stats
        state.stats.totalVenues = action.payload.length;
        state.stats.totalCapacity = action.payload.reduce((sum: number, venue: Venue) => sum + venue.capacity, 0);
        state.stats.activeEvents = action.payload.reduce((sum: number, venue: Venue) => sum + (venue.upcomingEventsCount || 0), 0);
      })
      .addCase(fetchMyVenues.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Search Venues
      .addCase(searchVenues.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchVenues.fulfilled, (state, action) => {
        state.isLoading = false;
        const { data, pagination } = action.payload;
        state.venues = data;
        state.pagination = pagination;
      })
      .addCase(searchVenues.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentVenue,
  setFilters,
  clearFilters,
  addToFavorites,
  removeFromFavorites,
  setCurrentVenue,
  updateVenueInList,
  removeVenueFromList,
  setVenueFilter,
  updateStats,
} = venuesSlice.actions;

export default venuesSlice.reducer;

