import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ticketsService } from '../services/tickets.service';

interface Ticket {
  id: string;
  eventId: string;
  buyerId?: string;
  qrCode: string;
  price: number;
  currency: string;
  status: string;
  purchaseDate?: string;
  usedDate?: string;
  transferTo?: string;
  transferDate?: string;
  refundReason?: string;
  refundDate?: string;
  createdAt: string;
  updatedAt: string;
  event?: any;
  buyer?: any;
  payment?: any;
  qrScans?: any[];
}

interface TicketsState {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    eventId?: string;
    buyerId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  validationResult: {
    valid: boolean;
    message: string;
    ticket?: Ticket;
  } | null;
}

const initialState: TicketsState = {
  tickets: [],
  currentTicket: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  filters: {},
  validationResult: null,
};

// Async thunks
export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (params: { page?: number; limit?: number; filters?: any } = {}, { rejectWithValue }) => {
    try {
      const response = await ticketsService.getTickets(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tickets');
    }
  }
);

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchTicketById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await ticketsService.getTicketById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ticket');
    }
  }
);

export const purchaseTickets = createAsyncThunk(
  'tickets/purchaseTickets',
  async (data: {
    eventId: string;
    quantity: number;
    paymentMethod: string;
    buyerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await ticketsService.purchaseTickets(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to purchase tickets');
    }
  }
);

export const validateTicket = createAsyncThunk(
  'tickets/validateTicket',
  async (data: { ticketId: string; qrCode: string }, { rejectWithValue }) => {
    try {
      const response = await ticketsService.validateTicket(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to validate ticket');
    }
  }
);

export const useTicket = createAsyncThunk(
  'tickets/useTicket',
  async ({ ticketId, scannedBy }: { ticketId: string; scannedBy?: string }, { rejectWithValue }) => {
    try {
      const response = await ticketsService.useTicket(ticketId, scannedBy);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to use ticket');
    }
  }
);

export const refundTicket = createAsyncThunk(
  'tickets/refundTicket',
  async ({ ticketId, reason }: { ticketId: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await ticketsService.refundTicket(ticketId, reason);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to refund ticket');
    }
  }
);

export const transferTicket = createAsyncThunk(
  'tickets/transferTicket',
  async ({ ticketId, newBuyerId }: { ticketId: string; newBuyerId: string }, { rejectWithValue }) => {
    try {
      const response = await ticketsService.transferTicket(ticketId, newBuyerId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to transfer ticket');
    }
  }
);

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<TicketsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<Partial<TicketsState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
    },
    clearValidationResult: (state) => {
      state.validationResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tickets
      .addCase(fetchTickets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tickets = action.payload.tickets;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Ticket by ID
      .addCase(fetchTicketById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTicket = action.payload;
        state.error = null;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Purchase Tickets
      .addCase(purchaseTickets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(purchaseTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tickets.unshift(...action.payload.tickets);
        state.error = null;
      })
      .addCase(purchaseTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Validate Ticket
      .addCase(validateTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(validateTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.validationResult = action.payload;
        state.error = null;
      })
      .addCase(validateTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Use Ticket
      .addCase(useTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(useTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.tickets.findIndex(ticket => ticket.id === action.payload.id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.currentTicket?.id === action.payload.id) {
          state.currentTicket = action.payload;
        }
        state.error = null;
      })
      .addCase(useTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Refund Ticket
      .addCase(refundTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refundTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.tickets.findIndex(ticket => ticket.id === action.payload.id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.currentTicket?.id === action.payload.id) {
          state.currentTicket = action.payload;
        }
        state.error = null;
      })
      .addCase(refundTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Transfer Ticket
      .addCase(transferTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(transferTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.tickets.findIndex(ticket => ticket.id === action.payload.id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.currentTicket?.id === action.payload.id) {
          state.currentTicket = action.payload;
        }
        state.error = null;
      })
      .addCase(transferTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setPagination,
  clearCurrentTicket,
  clearValidationResult,
} = ticketsSlice.actions;
export default ticketsSlice.reducer;

