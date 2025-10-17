// Generic API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    totalPages?: number;
    totalItems?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  statusCode?: number;
  timestamp?: string;
  path?: string;
}

// API request types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  search?: string;
  filters?: Record<string, any>;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

// File upload types
export interface FileUploadResponse {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    url: string;
    uploadedAt: string;
  };
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// WebSocket types
export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: string;
  userId?: string;
}

export interface WebSocketEvent {
  event: string;
  data: any;
  timestamp: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Analytics types
export interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;
  metrics: {
    [key: string]: number | string;
  };
  trends: Array<{
    date: string;
    value: number;
    label?: string;
  }>;
}

export interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  totalTickets: number;
  totalRevenue: number;
  activeSubscriptions: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
  }>;
}

// Export/Import types
export interface ExportRequest {
  type: 'events' | 'tickets' | 'payments' | 'users' | 'analytics';
  format: 'csv' | 'xlsx' | 'pdf';
  filters?: Record<string, any>;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface ExportResponse {
  success: boolean;
  message: string;
  downloadUrl?: string;
  expiresAt?: string;
}

export interface ImportRequest {
  type: 'events' | 'users' | 'venues';
  file: File;
  mapping?: Record<string, string>;
  options?: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    validateData?: boolean;
  };
}

export interface ImportResponse {
  success: boolean;
  message: string;
  data?: {
    totalRows: number;
    importedRows: number;
    skippedRows: number;
    errors: Array<{
      row: number;
      field: string;
      message: string;
    }>;
  };
}

// Health check types
export interface HealthCheckResponse {
  status: 'UP' | 'DOWN';
  timestamp: string;
  services: {
    database: 'UP' | 'DOWN';
    redis: 'UP' | 'DOWN';
    paymentGateway: 'UP' | 'DOWN';
    email: 'UP' | 'DOWN';
    sms: 'UP' | 'DOWN';
  };
  version: string;
  uptime: number;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Cache types
export interface CacheResponse<T = any> {
  data: T;
  cached: boolean;
  expiresAt?: string;
  key: string;
}

// API status types
export type ApiStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AsyncState<T = any> {
  data: T | null;
  status: ApiStatus;
  error: string | null;
  lastUpdated?: string;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Bulk operation types
export interface BulkOperationRequest {
  action: 'create' | 'update' | 'delete';
  items: Array<{
    id?: string;
    data: any;
  }>;
}

export interface BulkOperationResponse {
  success: boolean;
  message: string;
  data?: {
    totalItems: number;
    successfulItems: number;
    failedItems: number;
    results: Array<{
      id: string;
      success: boolean;
      message?: string;
      data?: any;
    }>;
  };
}
