import { STORAGE_KEYS } from './constants';

export interface TokenData {
  token: string;
  refreshToken: string;
  expiresAt?: number;
}

class TokenManager {
  /**
   * Store tokens in localStorage
   */
  setTokens(tokenData: TokenData): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokenData.token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken);
    
    if (tokenData.expiresAt) {
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, tokenData.expiresAt.toString());
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(): number | null {
    const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    return expiresAt ? parseInt(expiresAt, 10) : null;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const expiresAt = this.getTokenExpiration();
    if (!expiresAt) return true;
    
    // Add 5 minute buffer to account for clock skew
    return Date.now() >= (expiresAt - 5 * 60 * 1000);
  }

  /**
   * Check if token needs refresh (expires within 10 minutes)
   */
  needsRefresh(): boolean {
    const expiresAt = this.getTokenExpiration();
    if (!expiresAt) return true;
    
    // Refresh if token expires within 10 minutes
    return Date.now() >= (expiresAt - 10 * 60 * 1000);
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    return !!(token && refreshToken && !this.isTokenExpired());
  }

  /**
   * Get token payload (decode JWT)
   */
  getTokenPayload(token?: string): any {
    const tokenToDecode = token || this.getAccessToken();
    if (!tokenToDecode) return null;

    try {
      const base64Url = tokenToDecode.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Get user ID from token
   */
  getUserId(): string | null {
    const payload = this.getTokenPayload();
    return payload?.userId || payload?.sub || null;
  }

  /**
   * Get user role from token
   */
  getUserRole(): string | null {
    const payload = this.getTokenPayload();
    return payload?.role || null;
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

export const tokenManager = new TokenManager();
