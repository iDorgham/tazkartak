import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  // Loading states
  isLoading: boolean;
  loadingMessage: string;
  
  // Modal states
  isModalVisible: boolean;
  modalType: string | null;
  modalData: any;
  
  // Toast states
  toast: {
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  };
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  isDarkMode: boolean;
  
  // Language
  language: 'en' | 'ar';
  
  // Network
  isOnline: boolean;
  
  // App state
  appState: 'active' | 'background' | 'inactive';
  
  // Navigation
  currentRoute: string;
  navigationHistory: string[];
  
  // Bottom sheet
  isBottomSheetVisible: boolean;
  bottomSheetContent: any;
  
  // Drawer
  isDrawerOpen: boolean;
  
  // Search
  searchQuery: string;
  isSearchVisible: boolean;
  
  // Filters
  activeFilters: Record<string, any>;
  
  // Notifications
  unreadNotifications: number;
  
  // Onboarding
  onboardingCompleted: boolean;
  currentOnboardingStep: number;
}

const initialState: UIState = {
  // Loading states
  isLoading: false,
  loadingMessage: '',
  
  // Modal states
  isModalVisible: false,
  modalType: null,
  modalData: null,
  
  // Toast states
  toast: {
    visible: false,
    type: 'info',
    title: '',
    message: '',
  },
  
  // Theme
  theme: 'system',
  isDarkMode: false,
  
  // Language
  language: 'en',
  
  // Network
  isOnline: true,
  
  // App state
  appState: 'active',
  
  // Navigation
  currentRoute: '',
  navigationHistory: [],
  
  // Bottom sheet
  isBottomSheetVisible: false,
  bottomSheetContent: null,
  
  // Drawer
  isDrawerOpen: false,
  
  // Search
  searchQuery: '',
  isSearchVisible: false,
  
  // Filters
  activeFilters: {},
  
  // Notifications
  unreadNotifications: 0,
  
  // Onboarding
  onboardingCompleted: false,
  currentOnboardingStep: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Loading actions
    setLoading: (state, action: PayloadAction<{ isLoading: boolean; message?: string }>) => {
      state.isLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.message || '';
    },
    
    // Modal actions
    showModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      state.isModalVisible = true;
      state.modalType = action.payload.type;
      state.modalData = action.payload.data;
    },
    
    hideModal: (state) => {
      state.isModalVisible = false;
      state.modalType = null;
      state.modalData = null;
    },
    
    // Toast actions
    showToast: (state, action: PayloadAction<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>) => {
      state.toast = {
        visible: true,
        type: action.payload.type,
        title: action.payload.title,
        message: action.payload.message,
      };
    },
    
    hideToast: (state) => {
      state.toast.visible = false;
    },
    
    // Theme actions
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    
    // Language actions
    setLanguage: (state, action: PayloadAction<'en' | 'ar'>) => {
      state.language = action.payload;
    },
    
    // Network actions
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    
    // App state actions
    setAppState: (state, action: PayloadAction<'active' | 'background' | 'inactive'>) => {
      state.appState = action.payload;
    },
    
    // Navigation actions
    setCurrentRoute: (state, action: PayloadAction<string>) => {
      state.currentRoute = action.payload;
      if (state.navigationHistory[state.navigationHistory.length - 1] !== action.payload) {
        state.navigationHistory.push(action.payload);
        // Keep only last 10 routes
        if (state.navigationHistory.length > 10) {
          state.navigationHistory = state.navigationHistory.slice(-10);
        }
      }
    },
    
    goBack: (state) => {
      if (state.navigationHistory.length > 1) {
        state.navigationHistory.pop();
        state.currentRoute = state.navigationHistory[state.navigationHistory.length - 1];
      }
    },
    
    clearNavigationHistory: (state) => {
      state.navigationHistory = [state.currentRoute];
    },
    
    // Bottom sheet actions
    showBottomSheet: (state, action: PayloadAction<any>) => {
      state.isBottomSheetVisible = true;
      state.bottomSheetContent = action.payload;
    },
    
    hideBottomSheet: (state) => {
      state.isBottomSheetVisible = false;
      state.bottomSheetContent = null;
    },
    
    // Drawer actions
    openDrawer: (state) => {
      state.isDrawerOpen = true;
    },
    
    closeDrawer: (state) => {
      state.isDrawerOpen = false;
    },
    
    toggleDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
    
    // Search actions
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    showSearch: (state) => {
      state.isSearchVisible = true;
    },
    
    hideSearch: (state) => {
      state.isSearchVisible = false;
      state.searchQuery = '';
    },
    
    toggleSearch: (state) => {
      state.isSearchVisible = !state.isSearchVisible;
      if (!state.isSearchVisible) {
        state.searchQuery = '';
      }
    },
    
    // Filter actions
    setActiveFilters: (state, action: PayloadAction<Record<string, any>>) => {
      state.activeFilters = action.payload;
    },
    
    clearActiveFilters: (state) => {
      state.activeFilters = {};
    },
    
    updateFilter: (state, action: PayloadAction<{ key: string; value: any }>) => {
      state.activeFilters[action.payload.key] = action.payload.value;
    },
    
    removeFilter: (state, action: PayloadAction<string>) => {
      delete state.activeFilters[action.payload];
    },
    
    // Notification actions
    setUnreadNotifications: (state, action: PayloadAction<number>) => {
      state.unreadNotifications = action.payload;
    },
    
    incrementUnreadNotifications: (state) => {
      state.unreadNotifications += 1;
    },
    
    decrementUnreadNotifications: (state) => {
      if (state.unreadNotifications > 0) {
        state.unreadNotifications -= 1;
      }
    },
    
    clearUnreadNotifications: (state) => {
      state.unreadNotifications = 0;
    },
    
    // Onboarding actions
    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      state.onboardingCompleted = action.payload;
    },
    
    setCurrentOnboardingStep: (state, action: PayloadAction<number>) => {
      state.currentOnboardingStep = action.payload;
    },
    
    nextOnboardingStep: (state) => {
      state.currentOnboardingStep += 1;
    },
    
    previousOnboardingStep: (state) => {
      if (state.currentOnboardingStep > 0) {
        state.currentOnboardingStep -= 1;
      }
    },
    
    // Reset actions
    resetUI: (state) => {
      return { ...initialState, theme: state.theme, language: state.language };
    },
  },
});

export const {
  // Loading actions
  setLoading,
  
  // Modal actions
  showModal,
  hideModal,
  
  // Toast actions
  showToast,
  hideToast,
  
  // Theme actions
  setTheme,
  setDarkMode,
  
  // Language actions
  setLanguage,
  
  // Network actions
  setOnlineStatus,
  
  // App state actions
  setAppState,
  
  // Navigation actions
  setCurrentRoute,
  goBack,
  clearNavigationHistory,
  
  // Bottom sheet actions
  showBottomSheet,
  hideBottomSheet,
  
  // Drawer actions
  openDrawer,
  closeDrawer,
  toggleDrawer,
  
  // Search actions
  setSearchQuery,
  showSearch,
  hideSearch,
  toggleSearch,
  
  // Filter actions
  setActiveFilters,
  clearActiveFilters,
  updateFilter,
  removeFilter,
  
  // Notification actions
  setUnreadNotifications,
  incrementUnreadNotifications,
  decrementUnreadNotifications,
  clearUnreadNotifications,
  
  // Onboarding actions
  setOnboardingCompleted,
  setCurrentOnboardingStep,
  nextOnboardingStep,
  previousOnboardingStep,
  
  // Reset actions
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;

