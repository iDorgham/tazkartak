import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './index';
import { 
  venuesService, 
  Venue, 
  CreateVenueData, 
  UpdateVenueData, 
  VenueFilters, 
  VenuesResponse, 
  VenueStats,
  VenueVerificationData 
} from '../services/venues.service';

export interface VenuesState {
  venues: Venue[];
  currentVenue: Venue | null;
  loading: boolean;
  error: string | null;
  filters: VenueFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  amenities: string[];
  cities: string[];
  venueStats: VenueStats | null;
}

const initialState: VenuesState = {
  venues: [],
  currentVenue: null,
  loading: false,
  error: null,
  filters: {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  amenities: [],
  cities: [],
  venueStats: null,
};

// Async thunks
export const fetchVenues = createAsyncThunk(
  'venues/fetchVenues',
  async (filters: VenueFilters = {}, { rejectWithValue }) => {
    try {
      const response = await venuesService.getVenues(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchVerifiedVenues = createAsyncThunk(
  'venues/fetchVerifiedVenues',
  async (filters: Omit<VenueFilters, 'status'> = {}, { rejectWithValue }) => {
    try {
      const response = await venuesService.getVerifiedVenues(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchPendingVerificationVenues = createAsyncThunk(
  'venues/fetchPendingVerificationVenues',
  async (filters: Omit<VenueFilters, 'status'> = {}, { rejectWithValue }) => {
    try {
      const response = await venuesService.getPendingVerificationVenues(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchVenueById = createAsyncThunk(
  'venues/fetchVenueById',
  async (id: string, { rejectWithValue }) => {
    try {
      const venue = await venuesService.getVenueById(id);
      return venue;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createVenue = createAsyncThunk(
  'venues/createVenue',
  async (venueData: CreateVenueData, { rejectWithValue }) => {
    try {
      const venue = await venuesService.createVenue(venueData);
      return venue;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateVenue = createAsyncThunk(
  'venues/updateVenue',
  async ({ id, venueData }: { id: string; venueData: UpdateVenueData }, { rejectWithValue }) => {
    try {
      const venue = await venuesService.updateVenue(id, venueData);
      return venue;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteVenue = createAsyncThunk(
  'venues/deleteVenue',
  async (id: string, { rejectWithValue }) => {
    try {
      await venuesService.deleteVenue(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const verifyVenue = createAsyncThunk(
  'venues/verifyVenue',
  async ({ id, verificationData }: { id: string; verificationData: VenueVerificationData }, { rejectWithValue }) => {
    try {
      const venue = await venuesService.verifyVenue(id, verificationData);
      return venue;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchVenuesByOwner = createAsyncThunk(
  'venues/fetchVenuesByOwner',
  async (filters: Omit<VenueFilters, 'ownerId'> = {}, { rejectWithValue }) => {
    try {
      const response = await venuesService.getVenuesByOwner(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchVenueStats = createAsyncThunk(
  'venues/fetchVenueStats',
  async (venueId: string, { rejectWithValue }) => {
    try {
      const stats = await venuesService.getVenueStats(venueId);
      return { venueId, stats };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAvailableAmenities = createAsyncThunk(
  'venues/fetchAvailableAmenities',
  async (_, { rejectWithValue }) => {
    try {
      const amenities = await venuesService.getAvailableAmenities();
      return amenities;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchCitiesWithVenues = createAsyncThunk(
  'venues/fetchCitiesWithVenues',
  async (_, { rejectWithValue }) => {
    try {
      const cities = await venuesService.getCitiesWithVenues();
      return cities;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const searchVenuesByLocation = createAsyncThunk(
  'venues/searchVenuesByLocation',
  async ({ query, limit }: { query: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await venuesService.searchVenuesByLocation(query, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const venuesSlice = createSlice({
  name: 'venues',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<VenueFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentVenue: (state, action: PayloadAction<Venue | null>) => {
      state.currentVenue = action.payload;
    },
    clearVenueStats: (state) => {
      state.venueStats = null;
    },
    resetVenues: (state) => {
      state.venues = [];
      state.currentVenue = null;
      state.error = null;
      state.pagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch venues
      .addCase(fetchVenues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVenues.fulfilled, (state, action) => {
        state.loading = false;
        state.venues = action.payload.venues;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchVenues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch verified venues
      .addCase(fetchVerifiedVenues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVerifiedVenues.fulfilled, (state, action) => {
        state.loading = false;
        state.venues = action.payload.venues;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchVerifiedVenues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch pending verification venues
      .addCase(fetchPendingVerificationVenues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingVerificationVenues.fulfilled, (state, action) => {
        state.loading = false;
        state.venues = action.payload.venues;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchPendingVerificationVenues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch venue by ID
      .addCase(fetchVenueById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVenueById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVenue = action.payload;
      })
      .addCase(fetchVenueById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create venue
      .addCase(createVenue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVenue.fulfilled, (state, action) => {
        state.loading = false;
        state.venues.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createVenue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update venue
      .addCase(updateVenue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVenue.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.venues.findIndex(venue => venue.id === action.payload.id);
        if (index !== -1) {
          state.venues[index] = action.payload;
        }
        if (state.currentVenue?.id === action.payload.id) {
          state.currentVenue = action.payload;
        }
      })
      .addCase(updateVenue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete venue
      .addCase(deleteVenue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVenue.fulfilled, (state, action) => {
        state.loading = false;
        state.venues = state.venues.filter(venue => venue.id !== action.payload);
        state.pagination.total -= 1;
        if (state.currentVenue?.id === action.payload) {
          state.currentVenue = null;
        }
      })
      .addCase(deleteVenue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Verify venue
      .addCase(verifyVenue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyVenue.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.venues.findIndex(venue => venue.id === action.payload.id);
        if (index !== -1) {
          state.venues[index] = action.payload;
        }
        if (state.currentVenue?.id === action.payload.id) {
          state.currentVenue = action.payload;
        }
      })
      .addCase(verifyVenue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch venues by owner
      .addCase(fetchVenuesByOwner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVenuesByOwner.fulfilled, (state, action) => {
        state.loading = false;
        state.venues = action.payload.venues;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchVenuesByOwner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch venue stats
      .addCase(fetchVenueStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVenueStats.fulfilled, (state, action) => {
        state.loading = false;
        state.venueStats = action.payload.stats;
      })
      .addCase(fetchVenueStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch available amenities
      .addCase(fetchAvailableAmenities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableAmenities.fulfilled, (state, action) => {
        state.loading = false;
        state.amenities = action.payload;
      })
      .addCase(fetchAvailableAmenities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch cities with venues
      .addCase(fetchCitiesWithVenues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCitiesWithVenues.fulfilled, (state, action) => {
        state.loading = false;
        state.cities = action.payload;
      })
      .addCase(fetchCitiesWithVenues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Search venues by location
      .addCase(searchVenuesByLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchVenuesByLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.venues = action.payload.venues;
        state.pagination = {
          page: 1,
          limit: action.payload.venues.length,
          total: action.payload.total,
          totalPages: 1,
        };
      })
      .addCase(searchVenuesByLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearError, setCurrentVenue, clearVenueStats, resetVenues } = venuesSlice.actions;

// Selectors
export const selectVenues = (state: RootState) => state.venues.venues;
export const selectCurrentVenue = (state: RootState) => state.venues.currentVenue;
export const selectVenuesLoading = (state: RootState) => state.venues.loading;
export const selectVenuesError = (state: RootState) => state.venues.error;
export const selectVenuesFilters = (state: RootState) => state.venues.filters;
export const selectVenuesPagination = (state: RootState) => state.venues.pagination;
export const selectAvailableAmenities = (state: RootState) => state.venues.amenities;
export const selectCitiesWithVenues = (state: RootState) => state.venues.cities;
export const selectVenueStats = (state: RootState) => state.venues.venueStats;

export default venuesSlice.reducer;
