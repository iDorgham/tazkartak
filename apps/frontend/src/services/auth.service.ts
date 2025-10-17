import { apiService } from './api.service';
import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  RefreshTokenResponse,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData,
  UpdateProfileData 
} from '../types/auth.types';
import { STORAGE_KEYS } from '../utils/constants';

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post('/auth/login', credentials);
    const authData = response.data.data;
    
    // Store tokens
    if (authData.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authData.token);
    }
    if (authData.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
    }
    if (authData.user) {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(authData.user));
    }
    
    return authData;
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post('/auth/register', userData);
    const authData = response.data.data;
    
    // Store tokens
    if (authData.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authData.token);
    }
    if (authData.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
    }
    if (authData.user) {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(authData.user));
    }
    
    return authData;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await apiService.post('/auth/refresh-token', { refreshToken });
    const authData = response.data.data;
    
    // Update stored tokens
    if (authData.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authData.token);
    }
    if (authData.user) {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(authData.user));
    }
    
    return authData;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      await apiService.post('/auth/logout', { refreshToken });
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local storage
      this.clearAuthData();
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAllDevices(): Promise<void> {
    await apiService.post('/auth/logout-all-devices');
    this.clearAuthData();
  }

  /**
   * Get current user data
   */
  async getMe() {
    const response = await apiService.get('/auth/me');
    const user = response.data.data.user;
    
    // Update stored user data
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    
    return user;
  }

  /**
   * Forgot password
   */
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    await apiService.post('/auth/forgot-password', data);
  }

  /**
   * Reset password
   */
  async resetPassword(data: ResetPasswordData): Promise<void> {
    await apiService.post('/auth/reset-password', data);
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    await apiService.put('/auth/change-password', data);
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData) {
    const response = await apiService.put('/auth/profile', data);
    const user = response.data.data.user;
    
    // Update stored user data
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    
    return user;
  }

  /**
   * Verify email (to be implemented)
   */
  async verifyEmail(token: string): Promise<void> {
    await apiService.get(`/auth/verify-email/${token}`);
  }

  /**
   * Resend verification email (to be implemented)
   */
  async resendVerification(): Promise<void> {
    await apiService.post('/auth/resend-verification');
  }

  /**
   * Get stored auth token
   */
  getStoredToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Get stored refresh token
   */
  getStoredRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Get stored user data
   */
  getStoredUser() {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }

  /**
   * Clear all auth data from storage
   */
  clearAuthData(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Get user role
   */
  getUserRole(): string | null {
    const user = this.getStoredUser();
    return user?.role || null;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return roles.includes(userRole || '');
  }
}

export const authService = new AuthService();
