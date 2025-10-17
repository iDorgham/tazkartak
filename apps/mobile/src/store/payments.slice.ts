import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { paymentsService } from '@/services/payments.service';
import { Payment, PaymentFilters, InitiatePaymentRequest, CreatePaymentInput, PaymentResponse, PaymentGateway, PaymentMethod } from '@/types/payment.types';
import { PaginatedResponse } from '@/types/api.types';

interface PaymentsState {
  payments: Payment[];
  currentPayment: Payment | null;
  filters: PaymentFilters;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const initialState: PaymentsState = {
  payments: [],
  currentPayment: null,
  filters: {
    page: 1,
    limit: 20,
  },
  isLoading: false,
  isProcessing: false,
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
export const fetchPayments = createAsyncThunk(
  'payments/fetchPayments',
  async (filters: PaymentFilters, { rejectWithValue }) => {
    try {
      const response = await paymentsService.getPayments(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
    }
  }
);

export const initiatePayment = createAsyncThunk(
  'payments/initiatePayment',
  async (paymentData: InitiatePaymentRequest, { rejectWithValue }) => {
    try {
      const response = await paymentsService.initiatePayment(paymentData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to initiate payment');
    }
  }
);

export const fetchPaymentById = createAsyncThunk(
  'payments/fetchPaymentById',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const response = await paymentsService.getPaymentById(paymentId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payment');
    }
  }
);

export const checkPaymentStatus = createAsyncThunk(
  'payments/checkPaymentStatus',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const response = await paymentsService.checkPaymentStatus(paymentId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check payment status');
    }
  }
);

export const requestRefund = createAsyncThunk(
  'payments/requestRefund',
  async ({ paymentId, reason }: { paymentId: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await paymentsService.requestRefund(paymentId, reason);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to request refund');
    }
  }
);

// New payment system async thunks
export const createPayment = createAsyncThunk(
  'payments/createPayment',
  async (paymentInput: CreatePaymentInput, { rejectWithValue }) => {
    try {
      const response = await paymentsService.createPayment(paymentInput);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create payment');
    }
  }
);

export const processPayment = createAsyncThunk(
  'payments/processPayment',
  async ({ paymentId, paymentMethod, paymentDetails }: { 
    paymentId: string; 
    paymentMethod: string; 
    paymentDetails?: any 
  }, { rejectWithValue }) => {
    try {
      const response = await paymentsService.processPayment(paymentId, paymentMethod, paymentDetails);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to process payment');
    }
  }
);

export const refundPayment = createAsyncThunk(
  'payments/refundPayment',
  async ({ paymentId, amount }: { paymentId: string; amount?: number }, { rejectWithValue }) => {
    try {
      const response = await paymentsService.refundPayment(paymentId, amount);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refund payment');
    }
  }
);

export const getPaymentStatus = createAsyncThunk(
  'payments/getPaymentStatus',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const response = await paymentsService.getPaymentStatus(paymentId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get payment status');
    }
  }
);

export const handlePaymentCallback = createAsyncThunk(
  'payments/handlePaymentCallback',
  async (callback: any, { rejectWithValue }) => {
    try {
      const response = await paymentsService.handlePaymentCallback(callback);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to handle payment callback');
    }
  }
);

export const initializePaymentService = createAsyncThunk(
  'payments/initializePaymentService',
  async (_, { rejectWithValue }) => {
    try {
      await paymentsService.initialize();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize payment service');
    }
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    },
    setFilters: (state, action: PayloadAction<Partial<PaymentFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 20,
      };
    },
    setCurrentPayment: (state, action: PayloadAction<Payment>) => {
      state.currentPayment = action.payload;
    },
    updatePaymentInList: (state, action: PayloadAction<Payment>) => {
      const index = state.payments.findIndex(payment => payment.id === action.payload.id);
      if (index !== -1) {
        state.payments[index] = action.payload;
      }
      if (state.currentPayment?.id === action.payload.id) {
        state.currentPayment = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Payments
      .addCase(fetchPayments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        const { data, pagination } = action.payload;
        
        if (state.filters.page === 1) {
          state.payments = data;
        } else {
          state.payments = [...state.payments, ...data];
        }
        
        state.pagination = pagination;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Initiate Payment
      .addCase(initiatePayment.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(initiatePayment.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.payments.unshift(action.payload);
      })
      .addCase(initiatePayment.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      })
      
      // Fetch Payment by ID
      .addCase(fetchPaymentById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPayment = action.payload;
      })
      .addCase(fetchPaymentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Check Payment Status
      .addCase(checkPaymentStatus.fulfilled, (state, action) => {
        const updatedPayment = action.payload;
        const index = state.payments.findIndex(payment => payment.id === updatedPayment.id);
        if (index !== -1) {
          state.payments[index] = updatedPayment;
        }
        if (state.currentPayment?.id === updatedPayment.id) {
          state.currentPayment = updatedPayment;
        }
      })
      .addCase(checkPaymentStatus.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Request Refund
      .addCase(requestRefund.fulfilled, (state, action) => {
        const updatedPayment = action.payload;
        const index = state.payments.findIndex(payment => payment.id === updatedPayment.id);
        if (index !== -1) {
          state.payments[index] = updatedPayment;
        }
        if (state.currentPayment?.id === updatedPayment.id) {
          state.currentPayment = updatedPayment;
        }
      })
      .addCase(requestRefund.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Create Payment (New System)
      .addCase(createPayment.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.isProcessing = false;
        if (action.payload.success && action.payload.payment) {
          state.payments.unshift(action.payload.payment);
        }
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      })
      
      // Process Payment (New System)
      .addCase(processPayment.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.isProcessing = false;
        if (action.payload.success && action.payload.payment) {
          const updatedPayment = action.payload.payment;
          const index = state.payments.findIndex(payment => payment.id === updatedPayment.id);
          if (index !== -1) {
            state.payments[index] = updatedPayment;
          }
          if (state.currentPayment?.id === updatedPayment.id) {
            state.currentPayment = updatedPayment;
          }
        }
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      })
      
      // Refund Payment (New System)
      .addCase(refundPayment.fulfilled, (state, action) => {
        if (action.payload.success && action.payload.payment) {
          const updatedPayment = action.payload.payment;
          const index = state.payments.findIndex(payment => payment.id === updatedPayment.id);
          if (index !== -1) {
            state.payments[index] = updatedPayment;
          }
          if (state.currentPayment?.id === updatedPayment.id) {
            state.currentPayment = updatedPayment;
          }
        }
      })
      .addCase(refundPayment.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Get Payment Status (New System)
      .addCase(getPaymentStatus.fulfilled, (state, action) => {
        if (action.payload.success && action.payload.payment) {
          const updatedPayment = action.payload.payment;
          const index = state.payments.findIndex(payment => payment.id === updatedPayment.id);
          if (index !== -1) {
            state.payments[index] = updatedPayment;
          }
          if (state.currentPayment?.id === updatedPayment.id) {
            state.currentPayment = updatedPayment;
          }
        }
      })
      .addCase(getPaymentStatus.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Handle Payment Callback (New System)
      .addCase(handlePaymentCallback.fulfilled, (state, action) => {
        if (action.payload.success && action.payload.payment) {
          const updatedPayment = action.payload.payment;
          const index = state.payments.findIndex(payment => payment.id === updatedPayment.id);
          if (index !== -1) {
            state.payments[index] = updatedPayment;
          }
          if (state.currentPayment?.id === updatedPayment.id) {
            state.currentPayment = updatedPayment;
          }
        }
      })
      .addCase(handlePaymentCallback.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Initialize Payment Service
      .addCase(initializePaymentService.fulfilled, (state) => {
        // Service initialized successfully
      })
      .addCase(initializePaymentService.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentPayment,
  setFilters,
  clearFilters,
  setCurrentPayment,
  updatePaymentInList,
} = paymentsSlice.actions;

export default paymentsSlice.reducer;

