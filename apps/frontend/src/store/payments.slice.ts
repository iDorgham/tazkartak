import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  paymentsService, 
  PaymentMethod, 
  PaymentInitiationResult, 
  PaymentStatus, 
  PaymentDetails, 
  PaymentHistory,
  RefundResult 
} from '../services/payments.service';

export interface PaymentInitiationData {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  amount: number;
  currency?: string;
  paymentMethod: string;
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  returnUrl?: string;
}

export interface RefundRequest {
  amount: number;
  reason: string;
}

export interface PaymentsState {
  // Payment Methods
  paymentMethods: PaymentMethod[];
  
  // Current Payment
  currentPayment: PaymentInitiationResult | null;
  
  // Payment Status
  paymentStatus: PaymentStatus | null;
  
  // Payment Details
  paymentDetails: PaymentDetails | null;
  
  // Payment History
  paymentHistory: PaymentHistory | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Payment Form State
  selectedPaymentMethod: string | null;
  paymentFormData: Partial<PaymentInitiationData> | null;
  
  // Refund State
  refundResult: RefundResult | null;
}

const initialState: PaymentsState = {
  paymentMethods: [],
  currentPayment: null,
  paymentStatus: null,
  paymentDetails: null,
  paymentHistory: null,
  loading: false,
  error: null,
  selectedPaymentMethod: null,
  paymentFormData: null,
  refundResult: null,
};

// Async thunks
export const fetchPaymentMethods = createAsyncThunk(
  'payments/fetchPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const methods = await paymentsService.getPaymentMethods();
      return methods;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const initiatePayment = createAsyncThunk(
  'payments/initiatePayment',
  async (data: PaymentInitiationData, { rejectWithValue }) => {
    try {
      const result = await paymentsService.initiatePayment(data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getPaymentStatus = createAsyncThunk(
  'payments/getPaymentStatus',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const status = await paymentsService.getPaymentStatus(paymentId);
      return status;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getPaymentDetails = createAsyncThunk(
  'payments/getPaymentDetails',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const details = await paymentsService.getPaymentDetails(paymentId);
      return details;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getPaymentHistory = createAsyncThunk(
  'payments/getPaymentHistory',
  async (params?: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const history = await paymentsService.getPaymentHistory(params);
      return history;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const processRefund = createAsyncThunk(
  'payments/processRefund',
  async ({ paymentId, refundData }: { paymentId: string; refundData: RefundRequest }, { rejectWithValue }) => {
    try {
      const result = await paymentsService.processRefund(paymentId, refundData);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
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
    clearPaymentStatus: (state) => {
      state.paymentStatus = null;
    },
    clearPaymentDetails: (state) => {
      state.paymentDetails = null;
    },
    clearPaymentHistory: (state) => {
      state.paymentHistory = null;
    },
    clearRefundResult: (state) => {
      state.refundResult = null;
    },
    setSelectedPaymentMethod: (state, action: PayloadAction<string>) => {
      state.selectedPaymentMethod = action.payload;
    },
    setPaymentFormData: (state, action: PayloadAction<Partial<PaymentInitiationData>>) => {
      state.paymentFormData = { ...state.paymentFormData, ...action.payload };
    },
    resetPaymentState: (state) => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    // Fetch Payment Methods
    builder
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentMethods = action.payload;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Initiate Payment
    builder
      .addCase(initiatePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initiatePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload;
      })
      .addCase(initiatePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get Payment Status
    builder
      .addCase(getPaymentStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPaymentStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentStatus = action.payload;
      })
      .addCase(getPaymentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get Payment Details
    builder
      .addCase(getPaymentDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPaymentDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentDetails = action.payload;
      })
      .addCase(getPaymentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get Payment History
    builder
      .addCase(getPaymentHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPaymentHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentHistory = action.payload;
      })
      .addCase(getPaymentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Process Refund
    builder
      .addCase(processRefund.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processRefund.fulfilled, (state, action) => {
        state.loading = false;
        state.refundResult = action.payload;
      })
      .addCase(processRefund.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentPayment,
  clearPaymentStatus,
  clearPaymentDetails,
  clearPaymentHistory,
  clearRefundResult,
  setSelectedPaymentMethod,
  setPaymentFormData,
  resetPaymentState,
} = paymentsSlice.actions;

export default paymentsSlice.reducer;