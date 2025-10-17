export interface QRPayload {
  ticketId: string;
  eventId: string;
  timestamp: number;
  signature: string;
  ticket: Ticket;
}

export interface QRScanResult {
  id: string;
  ticketId: string;
  eventId: string;
  venueId: string;
  scannedBy: string;
  scannedAt: string;
  status: 'success' | 'failed' | 'duplicate';
  ticketHolder: string;
  offline: boolean;
  qrData: string;
  error?: string;
}

export interface QRValidationResult {
  isValid: boolean;
  ticket?: Ticket;
  error?: string;
  alreadyScanned?: boolean;
}

export interface Ticket {
  id: string;
  eventId: string;
  holderName: string;
  holderEmail: string;
  eventName: string;
  ticketType: string;
  seatNumber?: string;
  price: number;
  status: TicketStatus;
  purchaseDate: string;
  qrCode?: string;
  venueId?: string;
  metadata?: Record<string, any>;
}

export type TicketStatus = 'active' | 'used' | 'cancelled' | 'expired' | 'refunded';

export interface QRScanRequest {
  ticketId: string;
  eventId: string;
  venueId: string;
  scannedBy: string;
  qrData: string;
  timestamp?: number;
}

export interface QRScanResponse {
  success: boolean;
  scanResult: QRScanResult;
  message?: string;
}

export interface OfflineQRData {
  ticketId: string;
  eventId: string;
  venueId: string;
  timestamp: number;
  signature: string;
  ticketData: {
    holderName: string;
    ticketType: string;
    seatNumber?: string;
    price: number;
    status: TicketStatus;
  };
}

export interface QRScanFilters {
  eventId?: string;
  venueId?: string;
  status?: 'success' | 'failed' | 'duplicate';
  dateFrom?: string;
  dateTo?: string;
  scannedBy?: string;
  page?: number;
  limit?: number;
}

export interface QRScanStats {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  duplicateScans: number;
  scansByHour: { [hour: string]: number };
  scansByDay: { [day: string]: number };
  averageScanTime: number;
}

export interface QRCacheEntry {
  ticketId: string;
  eventId: string;
  ticketData: Ticket;
  cachedAt: number;
  expiresAt: number;
}

export interface QRValidationCache {
  [ticketId: string]: QRCacheEntry;
}

export interface QRScannerConfig {
  enableOfflineValidation: boolean;
  cacheExpirationHours: number;
  maxCacheSize: number;
  enableHapticFeedback: boolean;
  enableSoundFeedback: boolean;
  autoFocusInterval: number;
  scanTimeout: number;
}

export interface QRScannerState {
  isScanning: boolean;
  isProcessing: boolean;
  lastScanResult: QRScanResult | null;
  scanHistory: QRScanResult[];
  offlineCache: QRValidationCache;
  config: QRScannerConfig;
  error: string | null;
}

export interface QRCodeGenerationRequest {
  ticketId: string;
  eventId: string;
  venueId?: string;
  includeOfflineData?: boolean;
  expirationHours?: number;
}

export interface QRCodeGenerationResponse {
  success: boolean;
  qrCode: string;
  expiresAt: number;
  message?: string;
}

export interface BulkQRGenerationRequest {
  ticketIds: string[];
  eventId: string;
  venueId?: string;
  includeOfflineData?: boolean;
  expirationHours?: number;
}

export interface BulkQRGenerationResponse {
  success: boolean;
  qrCodes: { [ticketId: string]: string };
  failedTickets: string[];
  expiresAt: number;
  message?: string;
}

export interface QRValidationError {
  code: string;
  message: string;
  details?: any;
}

export const QR_VALIDATION_ERRORS = {
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  EXPIRED_QR: 'EXPIRED_QR',
  TICKET_NOT_FOUND: 'TICKET_NOT_FOUND',
  TICKET_ALREADY_USED: 'TICKET_ALREADY_USED',
  TICKET_CANCELLED: 'TICKET_CANCELLED',
  TICKET_EXPIRED: 'TICKET_EXPIRED',
  EVENT_MISMATCH: 'EVENT_MISMATCH',
  VENUE_MISMATCH: 'VENUE_MISMATCH',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
} as const;

export type QRValidationErrorCode = typeof QR_VALIDATION_ERRORS[keyof typeof QR_VALIDATION_ERRORS];