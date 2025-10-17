import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { qrService, QRValidationResult, QRStats, BulkValidationResult } from '../services/qr.service';

export interface QRState {
  // QR Code Generation
  generatedQR: string | null;
  
  // QR Code Validation
  validationResult: QRValidationResult | null;
  isScanning: boolean;
  
  // Bulk Operations
  bulkResults: BulkValidationResult | null;
  
  // Statistics
  qrStats: QRStats | null;
  
  // Scan History
  scanHistory: Array<{
    scannedAt: string;
    scannedBy: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    deviceInfo?: {
      userAgent: string;
      ipAddress: string;
    };
  }>;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Scanner State
  scannerActive: boolean;
  lastScanTime: string | null;
}

const initialState: QRState = {
  generatedQR: null,
  validationResult: null,
  isScanning: false,
  bulkResults: null,
  qrStats: null,
  scanHistory: [],
  loading: false,
  error: null,
  scannerActive: false,
  lastScanTime: null,
};

// Async thunks
export const generateQRCode = createAsyncThunk(
  'qr/generateQRCode',
  async ({ ticketId, eventId, buyerId }: { ticketId: string; eventId: string; buyerId: string }, { rejectWithValue }) => {
    try {
      const result = await qrService.generateQRCode(ticketId, eventId, buyerId);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const validateQRCode = createAsyncThunk(
  'qr/validateQRCode',
  async ({ qrCode, location }: { qrCode: string; location?: { latitude: number; longitude: number } }, { rejectWithValue }) => {
    try {
      const result = await qrService.validateQRCode(qrCode, location);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getQRCodeInfo = createAsyncThunk(
  'qr/getQRCodeInfo',
  async (qrCode: string, { rejectWithValue }) => {
    try {
      const result = await qrService.getQRCodeInfo(qrCode);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getScanHistory = createAsyncThunk(
  'qr/getScanHistory',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const result = await qrService.getScanHistory(ticketId);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const invalidateQRCode = createAsyncThunk(
  'qr/invalidateQRCode',
  async ({ ticketId, reason }: { ticketId: string; reason: string }, { rejectWithValue }) => {
    try {
      const result = await qrService.invalidateQRCode(ticketId, reason);
      return { ticketId, ...result };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getQRStats = createAsyncThunk(
  'qr/getQRStats',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const result = await qrService.getQRStats(eventId);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const bulkValidateQRCodes = createAsyncThunk(
  'qr/bulkValidateQRCodes',
  async (qrCodes: string[], { rejectWithValue }) => {
    try {
      const result = await qrService.bulkValidateQRCodes(qrCodes);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const generateQRCodeForEmail = createAsyncThunk(
  'qr/generateQRCodeForEmail',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const result = await qrService.generateQRCodeForEmail(ticketId);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const qrSlice = createSlice({
  name: 'qr',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearValidationResult: (state) => {
      state.validationResult = null;
    },
    clearGeneratedQR: (state) => {
      state.generatedQR = null;
    },
    clearBulkResults: (state) => {
      state.bulkResults = null;
    },
    clearScanHistory: (state) => {
      state.scanHistory = [];
    },
    setScannerActive: (state, action: PayloadAction<boolean>) => {
      state.scannerActive = action.payload;
    },
    setIsScanning: (state, action: PayloadAction<boolean>) => {
      state.isScanning = action.payload;
    },
    setLastScanTime: (state, action: PayloadAction<string>) => {
      state.lastScanTime = action.payload;
    },
    resetQRState: (state) => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    // Generate QR Code
    builder
      .addCase(generateQRCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateQRCode.fulfilled, (state, action) => {
        state.loading = false;
        state.generatedQR = action.payload.qrCode;
      })
      .addCase(generateQRCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Validate QR Code
    builder
      .addCase(validateQRCode.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.isScanning = true;
      })
      .addCase(validateQRCode.fulfilled, (state, action) => {
        state.loading = false;
        state.isScanning = false;
        state.validationResult = action.payload;
        state.lastScanTime = new Date().toISOString();
      })
      .addCase(validateQRCode.rejected, (state, action) => {
        state.loading = false;
        state.isScanning = false;
        state.error = action.payload as string;
      });

    // Get QR Code Info
    builder
      .addCase(getQRCodeInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQRCodeInfo.fulfilled, (state, action) => {
        state.loading = false;
        // Store the info in validationResult for display
        state.validationResult = {
          isValid: true,
          isUsed: action.payload.isScanned,
          ticket: action.payload.ticket,
          event: action.payload.event,
          buyer: action.payload.buyer
        };
      })
      .addCase(getQRCodeInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get Scan History
    builder
      .addCase(getScanHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getScanHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.scanHistory = action.payload;
      })
      .addCase(getScanHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Invalidate QR Code
    builder
      .addCase(invalidateQRCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(invalidateQRCode.fulfilled, (state) => {
        state.loading = false;
        // Clear validation result if the invalidated ticket was being displayed
        if (state.validationResult?.ticket?.id === state.validationResult?.ticket?.id) {
          state.validationResult = null;
        }
      })
      .addCase(invalidateQRCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get QR Stats
    builder
      .addCase(getQRStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQRStats.fulfilled, (state, action) => {
        state.loading = false;
        state.qrStats = action.payload;
      })
      .addCase(getQRStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Bulk Validate QR Codes
    builder
      .addCase(bulkValidateQRCodes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkValidateQRCodes.fulfilled, (state, action) => {
        state.loading = false;
        state.bulkResults = action.payload;
      })
      .addCase(bulkValidateQRCodes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Generate QR Code for Email
    builder
      .addCase(generateQRCodeForEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateQRCodeForEmail.fulfilled, (state, action) => {
        state.loading = false;
        // Store the generated QR for email
        state.generatedQR = action.payload.qrCodeDataURL;
      })
      .addCase(generateQRCodeForEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearValidationResult,
  clearGeneratedQR,
  clearBulkResults,
  clearScanHistory,
  setScannerActive,
  setIsScanning,
  setLastScanTime,
  resetQRState,
} = qrSlice.actions;

export default qrSlice.reducer;
