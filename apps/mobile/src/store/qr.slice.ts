import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { qrService } from '@/services/qr.service';
import { QRCode, QRScanResult, QRGenerationRequest } from '@/types/qr.types';

interface QRState {
  generatedCodes: QRCode[];
  scanHistory: QRScanResult[];
  currentQRCode: QRCode | null;
  lastScanResult: QRScanResult | null;
  isLoading: boolean;
  isGenerating: boolean;
  isScanning: boolean;
  error: string | null;
}

const initialState: QRState = {
  generatedCodes: [],
  scanHistory: [],
  currentQRCode: null,
  lastScanResult: null,
  isLoading: false,
  isGenerating: false,
  isScanning: false,
  error: null,
};

// Async thunks
export const generateQRCode = createAsyncThunk(
  'qr/generateQRCode',
  async (request: QRGenerationRequest, { rejectWithValue }) => {
    try {
      const response = await qrService.generateQRCode(request);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate QR code');
    }
  }
);

export const scanQRCode = createAsyncThunk(
  'qr/scanQRCode',
  async (qrData: string, { rejectWithValue }) => {
    try {
      const response = await qrService.scanQRCode(qrData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to scan QR code');
    }
  }
);

export const fetchScanHistory = createAsyncThunk(
  'qr/fetchScanHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await qrService.getScanHistory();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch scan history');
    }
  }
);

export const validateQRCode = createAsyncThunk(
  'qr/validateQRCode',
  async (qrData: string, { rejectWithValue }) => {
    try {
      const response = await qrService.validateQRCode(qrData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to validate QR code');
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
    clearCurrentQRCode: (state) => {
      state.currentQRCode = null;
    },
    clearLastScanResult: (state) => {
      state.lastScanResult = null;
    },
    setCurrentQRCode: (state, action: PayloadAction<QRCode>) => {
      state.currentQRCode = action.payload;
    },
    addGeneratedCode: (state, action: PayloadAction<QRCode>) => {
      state.generatedCodes.unshift(action.payload);
    },
    addScanResult: (state, action: PayloadAction<QRScanResult>) => {
      state.scanHistory.unshift(action.payload);
      state.lastScanResult = action.payload;
    },
    updateQRCodeInList: (state, action: PayloadAction<QRCode>) => {
      const index = state.generatedCodes.findIndex(code => code.id === action.payload.id);
      if (index !== -1) {
        state.generatedCodes[index] = action.payload;
      }
      if (state.currentQRCode?.id === action.payload.id) {
        state.currentQRCode = action.payload;
      }
    },
    removeQRCodeFromList: (state, action: PayloadAction<string>) => {
      state.generatedCodes = state.generatedCodes.filter(code => code.id !== action.payload);
      if (state.currentQRCode?.id === action.payload) {
        state.currentQRCode = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate QR Code
      .addCase(generateQRCode.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateQRCode.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.generatedCodes.unshift(action.payload);
        state.currentQRCode = action.payload;
      })
      .addCase(generateQRCode.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      })
      
      // Scan QR Code
      .addCase(scanQRCode.pending, (state) => {
        state.isScanning = true;
        state.error = null;
      })
      .addCase(scanQRCode.fulfilled, (state, action) => {
        state.isScanning = false;
        state.scanHistory.unshift(action.payload);
        state.lastScanResult = action.payload;
      })
      .addCase(scanQRCode.rejected, (state, action) => {
        state.isScanning = false;
        state.error = action.payload as string;
      })
      
      // Fetch Scan History
      .addCase(fetchScanHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchScanHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.scanHistory = action.payload;
      })
      .addCase(fetchScanHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Validate QR Code
      .addCase(validateQRCode.fulfilled, (state, action) => {
        state.lastScanResult = action.payload;
      })
      .addCase(validateQRCode.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentQRCode,
  clearLastScanResult,
  setCurrentQRCode,
  addGeneratedCode,
  addScanResult,
  updateQRCodeInList,
  removeQRCodeFromList,
} = qrSlice.actions;

export default qrSlice.reducer;

