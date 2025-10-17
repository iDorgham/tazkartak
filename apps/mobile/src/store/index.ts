import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import slices
import authReducer from './auth.slice';
import eventsReducer from './events.slice';
import ticketsReducer from './tickets.slice';
import venuesReducer from './venues.slice';
import paymentsReducer from './payments.slice';
import subscriptionsReducer from './subscriptions.slice';
import qrReducer from './qr.slice';
import uiReducer from './ui.slice';
import offlineReducer from './offline.slice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'events', 'tickets', 'venues', 'subscriptions', 'qr'], // Persist these slices
  blacklist: ['ui'], // Don't persist UI state
};

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'token', 'refreshToken', 'isAuthenticated'], // Only persist essential auth data
};

const eventsPersistConfig = {
  key: 'events',
  storage: AsyncStorage,
  whitelist: ['events', 'favorites'], // Cache events and favorites
};

const ticketsPersistConfig = {
  key: 'tickets',
  storage: AsyncStorage,
  whitelist: ['purchasedTickets'], // Cache purchased tickets for offline access
};

const venuesPersistConfig = {
  key: 'venues',
  storage: AsyncStorage,
  whitelist: ['venues', 'favorites'], // Cache venues and favorites
};

const subscriptionsPersistConfig = {
  key: 'subscriptions',
  storage: AsyncStorage,
  whitelist: ['currentSubscription'], // Cache current subscription
};

const qrPersistConfig = {
  key: 'qr',
  storage: AsyncStorage,
  whitelist: ['generatedCodes', 'scanHistory'], // Cache QR codes and scan history
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  events: persistReducer(eventsPersistConfig, eventsReducer),
  tickets: persistReducer(ticketsPersistConfig, ticketsReducer),
  venues: persistReducer(venuesPersistConfig, venuesReducer),
  payments: paymentsReducer, // Don't persist payment state
  subscriptions: persistReducer(subscriptionsPersistConfig, subscriptionsReducer),
  qr: persistReducer(qrPersistConfig, qrReducer),
  ui: uiReducer, // Don't persist UI state
  offline: offlineReducer, // Offline state management
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
