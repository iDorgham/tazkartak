import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './index';
import { eventsService, Event, CreateEventData, UpdateEventData, EventFilters, EventsResponse, EventStats } from '../services/events.service';

export interface EventsState {
  events: Event[];
  currentEvent: Event | null;
  loading: boolean;
  error: string | null;
  filters: EventFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  categories: string[];
  eventStats: EventStats | null;
}

const initialState: EventsState = {
  events: [],
  currentEvent: null,
  loading: false,
  error: null,
  filters: {
    page: 1,
    limit: 10,
    sortBy: 'startDate',
    sortOrder: 'asc',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  categories: [],
  eventStats: null,
};

// Async thunks
export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (filters: EventFilters = {}, { rejectWithValue }) => {
    try {
      const response = await eventsService.getEvents(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchPublicEvents = createAsyncThunk(
  'events/fetchPublicEvents',
  async (filters: Omit<EventFilters, 'isPublic'> = {}, { rejectWithValue }) => {
    try {
      const response = await eventsService.getPublicEvents(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (id: string, { rejectWithValue }) => {
    try {
      const event = await eventsService.getEventById(id);
      return event;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData: CreateEventData, { rejectWithValue }) => {
    try {
      const event = await eventsService.createEvent(eventData);
      return event;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ id, eventData }: { id: string; eventData: UpdateEventData }, { rejectWithValue }) => {
    try {
      const event = await eventsService.updateEvent(id, eventData);
      return event;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (id: string, { rejectWithValue }) => {
    try {
      await eventsService.deleteEvent(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const publishEvent = createAsyncThunk(
  'events/publishEvent',
  async (id: string, { rejectWithValue }) => {
    try {
      const event = await eventsService.publishEvent(id);
      return event;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const cancelEvent = createAsyncThunk(
  'events/cancelEvent',
  async ({ id, reason }: { id: string; reason?: string }, { rejectWithValue }) => {
    try {
      const event = await eventsService.cancelEvent(id, reason);
      return event;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchEventsByOrganizer = createAsyncThunk(
  'events/fetchEventsByOrganizer',
  async (filters: Omit<EventFilters, 'organizerId'> = {}, { rejectWithValue }) => {
    try {
      const response = await eventsService.getEventsByOrganizer(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchEventStats = createAsyncThunk(
  'events/fetchEventStats',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const stats = await eventsService.getEventStats(eventId);
      return { eventId, stats };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchEventCategories = createAsyncThunk(
  'events/fetchEventCategories',
  async (_, { rejectWithValue }) => {
    try {
      const categories = await eventsService.getEventCategories();
      return categories;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const searchEvents = createAsyncThunk(
  'events/searchEvents',
  async ({ query, limit }: { query: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await eventsService.searchEvents(query, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<EventFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentEvent: (state, action: PayloadAction<Event | null>) => {
      state.currentEvent = action.payload;
    },
    clearEventStats: (state) => {
      state.eventStats = null;
    },
    resetEvents: (state) => {
      state.events = [];
      state.currentEvent = null;
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
      // Fetch events
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch public events
      .addCase(fetchPublicEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchPublicEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch event by ID
      .addCase(fetchEventById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create event
      .addCase(createEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update event
      .addCase(updateEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.events.findIndex(event => event.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
        if (state.currentEvent?.id === action.payload.id) {
          state.currentEvent = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete event
      .addCase(deleteEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events = state.events.filter(event => event.id !== action.payload);
        state.pagination.total -= 1;
        if (state.currentEvent?.id === action.payload) {
          state.currentEvent = null;
        }
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Publish event
      .addCase(publishEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(publishEvent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.events.findIndex(event => event.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
        if (state.currentEvent?.id === action.payload.id) {
          state.currentEvent = action.payload;
        }
      })
      .addCase(publishEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Cancel event
      .addCase(cancelEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelEvent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.events.findIndex(event => event.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
        if (state.currentEvent?.id === action.payload.id) {
          state.currentEvent = action.payload;
        }
      })
      .addCase(cancelEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch events by organizer
      .addCase(fetchEventsByOrganizer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventsByOrganizer.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchEventsByOrganizer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch event stats
      .addCase(fetchEventStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventStats.fulfilled, (state, action) => {
        state.loading = false;
        state.eventStats = action.payload.stats;
      })
      .addCase(fetchEventStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch event categories
      .addCase(fetchEventCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchEventCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Search events
      .addCase(searchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(searchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearError, setCurrentEvent, clearEventStats, resetEvents } = eventsSlice.actions;

// Selectors
export const selectEvents = (state: RootState) => state.events.events;
export const selectCurrentEvent = (state: RootState) => state.events.currentEvent;
export const selectEventsLoading = (state: RootState) => state.events.loading;
export const selectEventsError = (state: RootState) => state.events.error;
export const selectEventsFilters = (state: RootState) => state.events.filters;
export const selectEventsPagination = (state: RootState) => state.events.pagination;
export const selectEventCategories = (state: RootState) => state.events.categories;
export const selectEventStats = (state: RootState) => state.events.eventStats;

export default eventsSlice.reducer;