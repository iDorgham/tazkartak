import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventsService } from '@/services/events.service';
import { Event, EventFilters, EventAnalytics, CreateEventInput, UpdateEventInput } from '@/types/event.types';
import { PaginatedResponse } from '@/types/api.types';

interface EventsState {
  events: Event[];
  currentEvent: Event | null;
  favorites: string[];
  filters: EventFilters;
  analytics: EventAnalytics | null;
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
}

const initialState: EventsState = {
  events: [],
  currentEvent: null,
  favorites: [],
  filters: {
    page: 1,
    limit: 20,
  },
  analytics: null,
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
};

// Async thunks
export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (filters: EventFilters, { rejectWithValue }) => {
    try {
      const response = await eventsService.getEvents(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
    }
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventsService.getEventById(eventId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch event');
    }
  }
);

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData: CreateEventInput, { rejectWithValue }) => {
    try {
      const response = await eventsService.createEvent(eventData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create event');
    }
  }
);

export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ eventId, eventData }: { eventId: string; eventData: UpdateEventInput }, { rejectWithValue }) => {
    try {
      const response = await eventsService.updateEvent(eventId, eventData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update event');
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      await eventsService.deleteEvent(eventId);
      return eventId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete event');
    }
  }
);

export const searchEvents = createAsyncThunk(
  'events/searchEvents',
  async (searchQuery: string, { rejectWithValue }) => {
    try {
      const response = await eventsService.searchEvents(searchQuery);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search events');
    }
  }
);

export const fetchEventAnalytics = createAsyncThunk(
  'events/fetchEventAnalytics',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventsService.getEventAnalytics(eventId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchEventAttendees = createAsyncThunk(
  'events/fetchEventAttendees',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventsService.getEventAttendees(eventId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendees');
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'events/toggleFavorite',
  async (eventId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const isFavorite = state.events.favorites.includes(eventId);
      
      if (isFavorite) {
        await eventsService.removeFromFavorites(eventId);
      } else {
        await eventsService.addToFavorites(eventId);
      }
      
      return eventId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle favorite');
    }
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
      state.analytics = null;
    },
    setFilters: (state, action: PayloadAction<Partial<EventFilters>>) => {
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
    setCurrentEvent: (state, action: PayloadAction<Event>) => {
      state.currentEvent = action.payload;
    },
    updateEventInList: (state, action: PayloadAction<Event>) => {
      const index = state.events.findIndex(event => event.id === action.payload.id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
      if (state.currentEvent?.id === action.payload.id) {
        state.currentEvent = action.payload;
      }
    },
    removeEventFromList: (state, action: PayloadAction<string>) => {
      state.events = state.events.filter(event => event.id !== action.payload);
      state.favorites = state.favorites.filter(id => id !== action.payload);
      if (state.currentEvent?.id === action.payload) {
        state.currentEvent = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Events
      .addCase(fetchEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        const { data, pagination } = action.payload;
        
        if (state.filters.page === 1) {
          state.events = data;
        } else {
          state.events = [...state.events, ...data];
        }
        
        state.pagination = pagination;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Event by ID
      .addCase(fetchEventById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create Event
      .addCase(createEvent.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.isCreating = false;
        state.events.unshift(action.payload);
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      })
      
      // Update Event
      .addCase(updateEvent.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.events.findIndex(event => event.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
        if (state.currentEvent?.id === action.payload.id) {
          state.currentEvent = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })
      
      // Delete Event
      .addCase(deleteEvent.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.events = state.events.filter(event => event.id !== action.payload);
        state.favorites = state.favorites.filter(id => id !== action.payload);
        if (state.currentEvent?.id === action.payload) {
          state.currentEvent = null;
        }
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      })
      
      // Search Events
      .addCase(searchEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        const { data, pagination } = action.payload;
        state.events = data;
        state.pagination = pagination;
      })
      .addCase(searchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Event Analytics
      .addCase(fetchEventAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchEventAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Toggle Favorite
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const eventId = action.payload;
        const isFavorite = state.favorites.includes(eventId);
        
        if (isFavorite) {
          state.favorites = state.favorites.filter(id => id !== eventId);
        } else {
          state.favorites.push(eventId);
        }
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentEvent,
  setFilters,
  clearFilters,
  addToFavorites,
  removeFromFavorites,
  setCurrentEvent,
  updateEventInList,
  removeEventFromList,
} = eventsSlice.actions;

export default eventsSlice.reducer;

