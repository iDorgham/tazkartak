import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { subscriptionsService } from '@/services/subscriptions.service';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '@/types/subscription.types';

interface SubscriptionsState {
  currentSubscription: Subscription | null;
  availablePlans: SubscriptionPlan[];
  usage: any;
  isLoading: boolean;
  isUpgrading: boolean;
  isCancelling: boolean;
  error: string | null;
}

const initialState: SubscriptionsState = {
  currentSubscription: null,
  availablePlans: [],
  usage: null,
  isLoading: false,
  isUpgrading: false,
  isCancelling: false,
  error: null,
};

// Async thunks
export const fetchCurrentSubscription = createAsyncThunk(
  'subscriptions/fetchCurrentSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const response = await subscriptionsService.getCurrentSubscription();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription');
    }
  }
);

export const fetchAvailablePlans = createAsyncThunk(
  'subscriptions/fetchAvailablePlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await subscriptionsService.getAvailablePlans();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plans');
    }
  }
);

export const upgradeSubscription = createAsyncThunk(
  'subscriptions/upgradeSubscription',
  async (planId: string, { rejectWithValue }) => {
    try {
      const response = await subscriptionsService.upgradeSubscription(planId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upgrade subscription');
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'subscriptions/cancelSubscription',
  async (reason?: string, { rejectWithValue }) => {
    try {
      const response = await subscriptionsService.cancelSubscription(reason);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel subscription');
    }
  }
);

export const fetchUsageStats = createAsyncThunk(
  'subscriptions/fetchUsageStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await subscriptionsService.getUsageStats();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch usage stats');
    }
  }
);

const subscriptionsSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentSubscription: (state, action: PayloadAction<Subscription>) => {
      state.currentSubscription = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Current Subscription
      .addCase(fetchCurrentSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(fetchCurrentSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Available Plans
      .addCase(fetchAvailablePlans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailablePlans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availablePlans = action.payload;
      })
      .addCase(fetchAvailablePlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Upgrade Subscription
      .addCase(upgradeSubscription.pending, (state) => {
        state.isUpgrading = true;
        state.error = null;
      })
      .addCase(upgradeSubscription.fulfilled, (state, action) => {
        state.isUpgrading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(upgradeSubscription.rejected, (state, action) => {
        state.isUpgrading = false;
        state.error = action.payload as string;
      })
      
      // Cancel Subscription
      .addCase(cancelSubscription.pending, (state) => {
        state.isCancelling = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.isCancelling = false;
        state.currentSubscription = action.payload;
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.isCancelling = false;
        state.error = action.payload as string;
      })
      
      // Fetch Usage Stats
      .addCase(fetchUsageStats.fulfilled, (state, action) => {
        state.usage = action.payload;
      })
      .addCase(fetchUsageStats.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setCurrentSubscription,
} = subscriptionsSlice.actions;

export default subscriptionsSlice.reducer;

