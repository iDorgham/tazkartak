import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  subscriptionsService,
  SubscriptionPlan,
  UserSubscription,
  SubscriptionCreateData,
  SubscriptionUpgradeData,
  EventCreationPermission,
  ApiUsagePermission,
  SubscriptionAnalytics
} from '../services/subscriptions.service';

export interface SubscriptionsState {
  // Plans
  plans: SubscriptionPlan[];
  
  // Current Subscription
  currentSubscription: UserSubscription | null;
  
  // Usage
  currentUsage: {
    eventsCreated: number;
    ticketsSold: number;
    revenue: number;
    apiCalls: number;
    webhookCalls: number;
    limits?: {
      eventsPerMonth: number;
      ticketsPerEvent: number;
      apiCallsPerMonth: number;
      webhookCallsPerMonth: number;
    };
  } | null;
  
  // Permissions
  eventCreationPermission: EventCreationPermission | null;
  apiUsagePermission: ApiUsagePermission | null;
  
  // Analytics (Admin)
  analytics: SubscriptionAnalytics | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Subscription Form State
  selectedPlan: string | null;
  subscriptionFormData: Partial<SubscriptionCreateData> | null;
  
  // Upgrade State
  upgradeResult: {
    success: boolean;
    newSubscriptionId: string;
    paymentResult?: any;
  } | null;
}

const initialState: SubscriptionsState = {
  plans: [],
  currentSubscription: null,
  currentUsage: null,
  eventCreationPermission: null,
  apiUsagePermission: null,
  analytics: null,
  loading: false,
  error: null,
  selectedPlan: null,
  subscriptionFormData: null,
  upgradeResult: null,
};

// Async thunks
export const fetchPlans = createAsyncThunk(
  'subscriptions/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const plans = await subscriptionsService.getPlans();
      return plans;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchCurrentSubscription = createAsyncThunk(
  'subscriptions/fetchCurrentSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const subscription = await subscriptionsService.getCurrentSubscription();
      return subscription;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createSubscription = createAsyncThunk(
  'subscriptions/createSubscription',
  async (data: SubscriptionCreateData, { rejectWithValue }) => {
    try {
      const result = await subscriptionsService.createSubscription(data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const upgradeSubscription = createAsyncThunk(
  'subscriptions/upgradeSubscription',
  async ({ subscriptionId, data }: { subscriptionId: string; data: SubscriptionUpgradeData }, { rejectWithValue }) => {
    try {
      const result = await subscriptionsService.upgradeSubscription(subscriptionId, data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'subscriptions/cancelSubscription',
  async ({ subscriptionId, reason }: { subscriptionId: string; reason?: string }, { rejectWithValue }) => {
    try {
      const result = await subscriptionsService.cancelSubscription(subscriptionId, reason);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchCurrentUsage = createAsyncThunk(
  'subscriptions/fetchCurrentUsage',
  async (_, { rejectWithValue }) => {
    try {
      const usage = await subscriptionsService.getCurrentUsage();
      return usage;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const checkEventCreationPermission = createAsyncThunk(
  'subscriptions/checkEventCreationPermission',
  async (_, { rejectWithValue }) => {
    try {
      const permission = await subscriptionsService.checkEventCreationPermission();
      return permission;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const trackEventCreation = createAsyncThunk(
  'subscriptions/trackEventCreation',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const result = await subscriptionsService.trackEventCreation(eventId);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const trackTicketSales = createAsyncThunk(
  'subscriptions/trackTicketSales',
  async ({ eventId, ticketCount, revenue }: { eventId: string; ticketCount: number; revenue: number }, { rejectWithValue }) => {
    try {
      const result = await subscriptionsService.trackTicketSales(eventId, ticketCount, revenue);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const trackApiUsage = createAsyncThunk(
  'subscriptions/trackApiUsage',
  async (apiCalls: number = 1, { rejectWithValue }) => {
    try {
      const result = await subscriptionsService.trackApiUsage(apiCalls);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchSubscriptionAnalytics = createAsyncThunk(
  'subscriptions/fetchSubscriptionAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const analytics = await subscriptionsService.getSubscriptionAnalytics();
      return analytics;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
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
    clearUpgradeResult: (state) => {
      state.upgradeResult = null;
    },
    setSelectedPlan: (state, action: PayloadAction<string>) => {
      state.selectedPlan = action.payload;
    },
    setSubscriptionFormData: (state, action: PayloadAction<Partial<SubscriptionCreateData>>) => {
      state.subscriptionFormData = { ...state.subscriptionFormData, ...action.payload };
    },
    resetSubscriptionState: (state) => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    // Fetch Plans
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Current Subscription
    builder
      .addCase(fetchCurrentSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(fetchCurrentSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Subscription
    builder
      .addCase(createSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.loading = false;
        // Don't update currentSubscription here as it's pending until payment is completed
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Upgrade Subscription
    builder
      .addCase(upgradeSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(upgradeSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.upgradeResult = action.payload;
      })
      .addCase(upgradeSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Cancel Subscription
    builder
      .addCase(cancelSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state) => {
        state.loading = false;
        // Refresh current subscription to reflect cancellation
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Current Usage
    builder
      .addCase(fetchCurrentUsage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUsage.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUsage = action.payload;
      })
      .addCase(fetchCurrentUsage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Check Event Creation Permission
    builder
      .addCase(checkEventCreationPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkEventCreationPermission.fulfilled, (state, action) => {
        state.loading = false;
        state.eventCreationPermission = action.payload;
      })
      .addCase(checkEventCreationPermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Track Event Creation
    builder
      .addCase(trackEventCreation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(trackEventCreation.fulfilled, (state) => {
        state.loading = false;
        // Increment events created in current usage
        if (state.currentUsage) {
          state.currentUsage.eventsCreated += 1;
        }
      })
      .addCase(trackEventCreation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Track Ticket Sales
    builder
      .addCase(trackTicketSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(trackTicketSales.fulfilled, (state, action) => {
        state.loading = false;
        // Update current usage (values will be updated by the action payload in real implementation)
      })
      .addCase(trackTicketSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Track API Usage
    builder
      .addCase(trackApiUsage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(trackApiUsage.fulfilled, (state, action) => {
        state.loading = false;
        state.apiUsagePermission = action.payload;
      })
      .addCase(trackApiUsage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Subscription Analytics
    builder
      .addCase(fetchSubscriptionAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchSubscriptionAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearUpgradeResult,
  setSelectedPlan,
  setSubscriptionFormData,
  resetSubscriptionState,
} = subscriptionsSlice.actions;

export default subscriptionsSlice.reducer;
