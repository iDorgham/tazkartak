// Storage keys for AsyncStorage
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  THEME_MODE: 'theme_mode',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  NOTIFICATION_PERMISSIONS: 'notification_permissions',
  CACHED_EVENTS: 'cached_events',
  CACHED_TICKETS: 'cached_tickets',
  OFFLINE_QUEUE: 'offline_queue',
  LAST_SYNC: 'last_sync',
  CACHE_DATA: 'cache_data',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    UPDATE_PROFILE: '/auth/update-profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  EVENTS: {
    LIST: '/events',
    CREATE: '/events',
    DETAIL: '/events/:id',
    UPDATE: '/events/:id',
    DELETE: '/events/:id',
    SEARCH: '/events/search',
    ANALYTICS: '/events/:id/analytics',
    ATTENDEES: '/events/:id/attendees',
  },
  TICKETS: {
    LIST: '/tickets',
    PURCHASE: '/tickets/purchase',
    DETAIL: '/tickets/:id',
    TRANSFER: '/tickets/:id/transfer',
    REFUND: '/tickets/:id/refund',
    VALIDATE: '/tickets/validate',
    QR_CODE: '/tickets/:id/qr',
  },
  VENUES: {
    LIST: '/venues',
    CREATE: '/venues',
    DETAIL: '/venues/:id',
    UPDATE: '/venues/:id',
    DELETE: '/venues/:id',
    VERIFY: '/venues/:id/verify',
    TEAM: '/venues/:id/team',
  },
  PAYMENTS: {
    INITIATE: '/payments/initiate',
    CALLBACK: '/payments/callback/:gateway',
    STATUS: '/payments/:id/status',
    REFUND: '/payments/:id/refund',
  },
  SUBSCRIPTIONS: {
    CURRENT: '/subscriptions/current',
    PLANS: '/subscriptions/plans',
    UPGRADE: '/subscriptions/upgrade',
    CANCEL: '/subscriptions/cancel',
    USAGE: '/subscriptions/usage',
  },
  QR: {
    GENERATE: '/qr/generate',
    SCAN: '/qr/scan',
    HISTORY: '/qr/history',
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    EVENTS: '/analytics/events',
    REVENUE: '/analytics/revenue',
    USERS: '/analytics/users',
  },
  WEBHOOKS: {
    PAYMENT: '/webhooks/payment/:gateway',
    NOTIFICATION: '/webhooks/notification',
  },
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  ORGANIZER: 'ORGANIZER',
  VENUE_OWNER: 'VENUE_OWNER',
  BUYER: 'BUYER',
} as const;

// Event statuses
export const EVENT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  LIVE: 'LIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

// Event categories
export const EVENT_CATEGORIES = {
  MUSIC: 'MUSIC',
  SPORTS: 'SPORTS',
  CONFERENCE: 'CONFERENCE',
  EXHIBITION: 'EXHIBITION',
  WORKSHOP: 'WORKSHOP',
  FESTIVAL: 'FESTIVAL',
  WEDDING: 'WEDDING',
  CORPORATE: 'CORPORATE',
  EDUCATION: 'EDUCATION',
  OTHER: 'OTHER',
} as const;

// Ticket statuses
export const TICKET_STATUS = {
  AVAILABLE: 'AVAILABLE',
  SOLD: 'SOLD',
  USED: 'USED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

// Payment methods
export const PAYMENT_METHODS = {
  PAYMOB: 'PAYMOB',
  FAWRY: 'FAWRY',
} as const;

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  BASIC: 'BASIC',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
} as const;

// Subscription statuses
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  PENDING: 'PENDING',
} as const;

// App constants
export const APP_CONFIG = {
  NAME: 'Tazkartak',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  SUPPORT_EMAIL: 'support@tazkartak.com',
  WEBSITE: 'https://tazkartak.com',
  PRIVACY_POLICY: 'https://tazkartak.com/privacy',
  TERMS_OF_SERVICE: 'https://tazkartak.com/terms',
} as const;

// API configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:3000/api' : 'https://api.tazkartak.com/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  EVENTS_TTL: 5 * 60 * 1000, // 5 minutes
  TICKETS_TTL: 24 * 60 * 60 * 1000, // 24 hours
  VENUES_TTL: 30 * 60 * 1000, // 30 minutes
  USER_DATA_TTL: 60 * 60 * 1000, // 1 hour
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
} as const;

// Offline configuration
export const OFFLINE_CONFIG = {
  MAX_QUEUE_SIZE: 100,
  SYNC_INTERVAL: 30 * 1000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5 seconds
} as const;

// QR Code configuration
export const QR_CONFIG = {
  SIZE: 256,
  ERROR_CORRECTION_LEVEL: 'M',
  MARGIN: 4,
  COLOR: '#000000',
  BACKGROUND_COLOR: '#FFFFFF',
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  TICKET_PURCHASED: 'TICKET_PURCHASED',
  EVENT_REMINDER: 'EVENT_REMINDER',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  EVENT_UPDATED: 'EVENT_UPDATED',
  EVENT_CANCELLED: 'EVENT_CANCELLED',
  SUBSCRIPTION_EXPIRY: 'SUBSCRIPTION_EXPIRY',
  ADMIN_ANNOUNCEMENT: 'ADMIN_ANNOUNCEMENT',
} as const;

// Deep link schemes
export const DEEP_LINK_SCHEMES = {
  TICKET: 'tazkartak://ticket',
  EVENT: 'tazkartak://event',
  PAYMENT: 'tazkartak://payment',
  RESET_PASSWORD: 'tazkartak://reset-password',
  VERIFY_EMAIL: 'tazkartak://verify-email',
} as const;

// Validation rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PHONE_PATTERN: /^(\+20|0)?1[0-9]{9}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EVENT_TITLE_MIN_LENGTH: 3,
  EVENT_TITLE_MAX_LENGTH: 100,
  EVENT_DESCRIPTION_MAX_LENGTH: 2000,
  VENUE_NAME_MIN_LENGTH: 3,
  VENUE_NAME_MAX_LENGTH: 100,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  TIME_ONLY: 'HH:mm',
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_DIMENSIONS: 2048,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILES_PER_UPLOAD: 10,
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  APP_LAUNCH_TIME: 2000, // 2 seconds
  API_RESPONSE_TIME: 5000, // 5 seconds
  QR_GENERATION_TIME: 500, // 500ms
  QR_SCAN_TIME: 1000, // 1 second
  IMAGE_LOAD_TIME: 3000, // 3 seconds
} as const;
