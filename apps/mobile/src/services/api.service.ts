import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '@/store';
import { clearCredentials, refreshAccessToken } from '@/store/auth.slice';
import { API_CONFIG, STORAGE_KEYS } from '@/utils/constants';
import NetInfo from '@react-native-community/netinfo';

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        // Check network connectivity
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          throw new Error('No internet connection');
        }

        // Add auth token
        const state = store.getState();
        const token = state.auth.token || await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add device info
        config.headers['X-Device-Platform'] = 'mobile';
        config.headers['X-App-Version'] = '1.0.0';

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const state = store.getState();
            const refreshToken = state.auth.refreshToken || await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            
            if (refreshToken) {
              // Dispatch refresh token action
              const resultAction = await store.dispatch(refreshAccessToken());
              
              if (refreshAccessToken.fulfilled.match(resultAction)) {
                const newToken = resultAction.payload.token;
                
                // Process queued requests
                this.processQueue(null, newToken);
                
                // Retry the original request
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return this.api(originalRequest);
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            this.processQueue(refreshError, null);
          } finally {
            this.isRefreshing = false;
          }
          
          // If refresh fails, clear credentials
          store.dispatch(clearCredentials());
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER_DATA,
          ]);
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private processQueue(error: any, token: string | null = null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'Server error';
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Generic HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }

  // File upload
  async uploadFile<T = any>(
    url: string,
    file: any,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.fileName || 'file',
    });

    return this.api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  }

  // Multiple file upload
  async uploadFiles<T = any>(
    url: string,
    files: any[],
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, {
        uri: file.uri,
        type: file.type,
        name: file.fileName || `file_${index}`,
      });
    });

    return this.api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  }

  // Health check
  async healthCheck(): Promise<AxiosResponse<{ status: string; timestamp: string }>> {
    return this.api.get('/health');
  }

  // Cancel request
  createCancelToken() {
    return axios.CancelToken.source();
  }

  // Retry request with exponential backoff
  async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    maxRetries: number = API_CONFIG.RETRY_ATTEMPTS,
    delay: number = API_CONFIG.RETRY_DELAY
  ): Promise<AxiosResponse<T>> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (i === maxRetries - 1) {
          throw error;
        }

        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }

    throw lastError;
  }

  // Batch requests
  async batchRequests<T>(requests: Array<() => Promise<AxiosResponse<T>>>): Promise<AxiosResponse<T>[]> {
    return Promise.all(requests.map(request => request()));
  }

  // Download file
  async downloadFile(url: string, filename?: string): Promise<string> {
    const response = await this.api.get(url, {
      responseType: 'blob',
    });

    // In React Native, you would typically use a library like react-native-fs
    // to save the file to the device
    const fileUri = `file://${filename || 'download'}`;
    
    // Implementation would depend on the file saving library
    return fileUri;
  }
}

export const apiService = new ApiService();
