// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
export const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3000';

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  ORGANIZER: 'ORGANIZER',
  VENUE: 'VENUE',
  BUYER: 'BUYER',
} as const;

// Payment Gateways
export const PAYMENT_GATEWAYS = {
  PAYMOB: 'PAYMOB',
  FAWRY: 'FAWRY',
  STRIPE: 'STRIPE',
} as const;

// Event Statuses
export const EVENT_STATUSES = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

// Ticket Statuses
export const TICKET_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  USED: 'USED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  BASIC: 'BASIC',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE: /^(\+20|0)?1[0-9]{9}$/,
  NAME: /^[a-zA-Z\u0600-\u06FF\s]{2,50}$/,
  URL: /^https?:\/\/.+/,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PASSWORD: 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
  INVALID_PHONE: 'Please enter a valid Egyptian phone number',
  INVALID_NAME: 'Name must contain only letters and be 2-50 characters long',
  INVALID_URL: 'Please enter a valid URL',
  PASSWORD_MISMATCH: 'Passwords do not match',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'Internal server error. Please try again later.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back!',
  REGISTER_SUCCESS: 'Account created successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
  PASSWORD_CHANGE_SUCCESS: 'Password changed successfully',
  PROFILE_UPDATE_SUCCESS: 'Profile updated successfully',
  EVENT_CREATE_SUCCESS: 'Event created successfully',
  EVENT_UPDATE_SUCCESS: 'Event updated successfully',
  EVENT_DELETE_SUCCESS: 'Event deleted successfully',
  TICKET_PURCHASE_SUCCESS: 'Ticket purchased successfully',
  TICKET_VALIDATE_SUCCESS: 'Ticket validated successfully',
  PAYMENT_SUCCESS: 'Payment completed successfully',
  SUBSCRIPTION_SUCCESS: 'Subscription activated successfully',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'tazkartak_auth_token',
  REFRESH_TOKEN: 'tazkartak_refresh_token',
  USER_DATA: 'tazkartak_user_data',
  TOKEN_EXPIRES_AT: 'tazkartak_token_expires_at',
  THEME_MODE: 'tazkartak_theme_mode',
  LANGUAGE: 'tazkartak_language',
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: 'yyyy-MM-dd HH:mm:ss',
  TIME_ONLY: 'HH:mm',
} as const;

// Currency
export const CURRENCY = {
  SYMBOL: 'EGP',
  CODE: 'EGP',
  LOCALE: 'ar-EG',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
} as const;

// QR Code
export const QR_CODE = {
  SIZE: 256,
  ERROR_CORRECTION_LEVEL: 'M' as const,
  MARGIN: 4,
} as const;

// Subscription Limits
export const SUBSCRIPTION_LIMITS = {
  BASIC: {
    EVENTS: 5,
    TICKETS_PER_EVENT: 100,
    ANALYTICS: false,
    CUSTOM_BRANDING: false,
    API_ACCESS: false,
  },
  PRO: {
    EVENTS: 50,
    TICKETS_PER_EVENT: 1000,
    ANALYTICS: true,
    CUSTOM_BRANDING: true,
    API_ACCESS: true,
  },
  ENTERPRISE: {
    EVENTS: -1, // Unlimited
    TICKETS_PER_EVENT: -1, // Unlimited
    ANALYTICS: true,
    CUSTOM_BRANDING: true,
    API_ACCESS: true,
  },
} as const;

// Theme
export const THEME = {
  PRIMARY_COLOR: '#1976d2',
  SECONDARY_COLOR: '#dc004e',
  SUCCESS_COLOR: '#2e7d32',
  WARNING_COLOR: '#ed6c02',
  ERROR_COLOR: '#d32f2f',
  INFO_COLOR: '#0288d1',
} as const;

// Breakpoints
export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 900,
  LG: 1200,
  XL: 1536,
} as const;

// Animation
export const ANIMATION = {
  DURATION_SHORT: 150,
  DURATION_STANDARD: 300,
  DURATION_COMPLEX: 375,
  DURATION_ENTERING: 225,
  DURATION_LEAVING: 195,
} as const;