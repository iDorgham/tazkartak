import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ticketsService } from '@/services/tickets.service';
import { Ticket, CreateTicketInput, TicketFilters } from '@/types/ticket.types';
import { PaginatedResponse } from '@/types/api.types';

interface TicketsState {
  purchasedTickets: Ticket[];
  currentTicket: Ticket | null;
  filters: TicketFilters;
  isLoading: boolean;
  isPurchasing: boolean;
  isTransferring: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const initialState: TicketsState = {
  purchasedTickets: [],
  currentTicket: null,
  filters: {
    page: 1,
    limit: 20,
  },
  isLoading: false,
  isPurchasing: false,
  isTransferring: false,
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
export const fetchPurchasedTickets = createAsyncThunk(
  'tickets/fetchPurchasedTickets',
  async (filters: TicketFilters, { rejectWithValue }) => {
    try {
      const response = await ticketsService.getPurchasedTickets(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tickets');
    }
  }
);

export const purchaseTicket = createAsyncThunk(
  'tickets/purchaseTicket',
  async (ticketData: CreateTicketInput, { rejectWithValue }) => {
    try {
      const response = await ticketsService.purchaseTicket(ticketData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to purchase ticket');
    }
  }
);

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchTicketById',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const response = await ticketsService.getTicketById(ticketId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ticket');
    }
  }
);

export const transferTicket = createAsyncThunk(
  'tickets/transferTicket',
  async ({ ticketId, email }: { ticketId: string; email: string }, { rejectWithValue }) => {
    try {
      const response = await ticketsService.transferTicket(ticketId, email);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to transfer ticket');
    }
  }
);

export const requestRefund = createAsyncThunk(
  'tickets/requestRefund',
  async ({ ticketId, reason }: { ticketId: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await ticketsService.requestRefund(ticketId, reason);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to request refund');
    }
  }
);

export const validateTicket = createAsyncThunk(
  'tickets/validateTicket',
  async (qrCode: string, { rejectWithValue }) => {
    try {
      const response = await ticketsService.validateTicket(qrCode);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to validate ticket');
    }
  }
);

export const generateQRCode = createAsyncThunk(
  'tickets/generateQRCode',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const response = await ticketsService.generateQRCode(ticketId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate QR code');
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
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
    },
    setFilters: (state, action: PayloadAction<Partial<TicketFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 20,
      };
    },
    setCurrentTicket: (state, action: PayloadAction<Ticket>) => {
      state.currentTicket = action.payload;
    },
    updateTicketInList: (state, action: PayloadAction<Ticket>) => {
      const index = state.purchasedTickets.findIndex(ticket => ticket.id === action.payload.id);
      if (index !== -1) {
        state.purchasedTickets[index] = action.payload;
      }
      if (state.currentTicket?.id === action.payload.id) {
        state.currentTicket = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Purchased Tickets
      .addCase(fetchPurchasedTickets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPurchasedTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        const { data, pagination } = action.payload;
        
        if (state.filters.page === 1) {
          state.purchasedTickets = data;
        } else {
          state.purchasedTickets = [...state.purchasedTickets, ...data];
        }
        
        state.pagination = pagination;
      })
      .addCase(fetchPurchasedTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Purchase Ticket
      .addCase(purchaseTicket.pending, (state) => {
        state.isPurchasing = true;
        state.error = null;
      })
      .addCase(purchaseTicket.fulfilled, (state, action) => {
        state.isPurchasing = false;
        state.purchasedTickets.unshift(action.payload);
      })
      .addCase(purchaseTicket.rejected, (state, action) => {
        state.isPurchasing = false;
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
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Transfer Ticket
      .addCase(transferTicket.pending, (state) => {
        state.isTransferring = true;
        state.error = null;
      })
      .addCase(transferTicket.fulfilled, (state, action) => {
        state.isTransferring = false;
        const updatedTicket = action.payload;
        const index = state.purchasedTickets.findIndex(ticket => ticket.id === updatedTicket.id);
        if (index !== -1) {
          state.purchasedTickets[index] = updatedTicket;
        }
        if (state.currentTicket?.id === updatedTicket.id) {
          state.currentTicket = updatedTicket;
        }
      })
      .addCase(transferTicket.rejected, (state, action) => {
        state.isTransferring = false;
        state.error = action.payload as string;
      })
      
      // Request Refund
      .addCase(requestRefund.fulfilled, (state, action) => {
        const updatedTicket = action.payload;
        const index = state.purchasedTickets.findIndex(ticket => ticket.id === updatedTicket.id);
        if (index !== -1) {
          state.purchasedTickets[index] = updatedTicket;
        }
        if (state.currentTicket?.id === updatedTicket.id) {
          state.currentTicket = updatedTicket;
        }
      })
      .addCase(requestRefund.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Validate Ticket
      .addCase(validateTicket.fulfilled, (state, action) => {
        // Handle validation result
        state.error = null;
      })
      .addCase(validateTicket.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Generate QR Code
      .addCase(generateQRCode.fulfilled, (state, action) => {
        const { ticketId, qrCode } = action.payload;
        const ticket = state.purchasedTickets.find(t => t.id === ticketId);
        if (ticket) {
          ticket.qrCode = qrCode;
        }
        if (state.currentTicket?.id === ticketId) {
          state.currentTicket.qrCode = qrCode;
        }
      })
      .addCase(generateQRCode.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentTicket,
  setFilters,
  clearFilters,
  setCurrentTicket,
  updateTicketInList,
} = ticketsSlice.actions;

export default ticketsSlice.reducer;

