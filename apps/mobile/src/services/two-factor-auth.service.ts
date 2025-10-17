import * as Crypto from 'expo-crypto';
import { secureStorageService } from './secure-storage.service';
import { analyticsService } from './analytics.service';
import { crashReportingService } from './crash-reporting.service';

interface TOTPConfig {
  issuer: string;
  accountName: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number; // seconds
  secret: string;
}

interface BackupCode {
  code: string;
  used: boolean;
  createdAt: number;
}

interface TwoFactorSetup {
  isEnabled: boolean;
  totpSecret?: string;
  backupCodes: BackupCode[];
  qrCodeUrl?: string;
  createdAt?: number;
  lastUsed?: number;
}

interface VerificationResult {
  success: boolean;
  code?: string;
  backupCodeUsed?: boolean;
  remainingAttempts?: number;
  lockedUntil?: number;
}

class TwoFactorAuthService {
  private isInitialized = false;
  private readonly STORAGE_KEY = '2fa_setup';
  private readonly BACKUP_CODES_COUNT = 10;
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly BACKUP_CODE_LENGTH = 8;

  async initialize(): Promise<void> {
    try {
      this.isInitialized = true;
      console.log('Two-factor authentication service initialized');
      
      await analyticsService.trackEvent('2fa_service_initialized', {
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to initialize 2FA service:', error);
      crashReportingService.captureException(error as Error, {
        context: '2fa_service_initialization',
      });
    }
  }

  // Generate TOTP secret and setup QR code
  async generateTOTPSetup(userId: string, userEmail: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
    manualEntryKey: string;
  }> {
    try {
      // Generate random secret (32 bytes)
      const secretBytes = Crypto.getRandomBytes(32);
      const secret = this.base32Encode(secretBytes);
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Create TOTP configuration
      const totpConfig: TOTPConfig = {
        issuer: 'Tazkartak',
        accountName: userEmail,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret,
      };

      // Generate QR code URL
      const qrCodeUrl = this.generateQRCodeUrl(totpConfig);
      
      // Store setup temporarily (will be confirmed after verification)
      const setup: TwoFactorSetup = {
        isEnabled: false,
        totpSecret: secret,
        backupCodes: backupCodes.map(code => ({
          code,
          used: false,
          createdAt: Date.now(),
        })),
        qrCodeUrl,
        createdAt: Date.now(),
      };

      await secureStorageService.setItem(`${this.STORAGE_KEY}_temp`, setup, true);

      // Track 2FA setup generation
      await analyticsService.trackEvent('2fa_setup_generated', {
        userId,
        userEmail,
        timestamp: Date.now(),
      });

      return {
        secret,
        qrCodeUrl,
        backupCodes: backupCodes.map(bc => bc.code),
        manualEntryKey: secret,
      };
    } catch (error) {
      console.error('Failed to generate TOTP setup:', error);
      crashReportingService.captureException(error as Error, {
        context: '2fa_setup_generation',
        userId,
      });
      throw error;
    }
  }

  // Verify TOTP code and enable 2FA
  async verifyAndEnable2FA(userId: string, code: string): Promise<{
    success: boolean;
    backupCodes?: string[];
    message?: string;
  }> {
    try {
      // Get temporary setup
      const tempSetup = await secureStorageService.getItem<TwoFactorSetup>(`${this.STORAGE_KEY}_temp`);
      if (!tempSetup || !tempSetup.totpSecret) {
        throw new Error('No pending 2FA setup found');
      }

      // Verify the code
      const isValid = await this.verifyTOTPCode(tempSetup.totpSecret, code);
      
      if (!isValid) {
        await analyticsService.trackEvent('2fa_verification_failed', {
          userId,
          reason: 'invalid_code',
          timestamp: Date.now(),
        });
        return { success: false, message: 'Invalid verification code' };
      }

      // Enable 2FA
      const finalSetup: TwoFactorSetup = {
        ...tempSetup,
        isEnabled: true,
        lastUsed: Date.now(),
      };

      await secureStorageService.setItem(this.STORAGE_KEY, finalSetup, true);
      await secureStorageService.removeItem(`${this.STORAGE_KEY}_temp`);

      // Track successful 2FA enablement
      await analyticsService.trackEvent('2fa_enabled', {
        userId,
        timestamp: Date.now(),
      });

      return {
        success: true,
        backupCodes: finalSetup.backupCodes.map(bc => bc.code),
        message: 'Two-factor authentication enabled successfully',
      };
    } catch (error) {
      console.error('Failed to verify and enable 2FA:', error);
      crashReportingService.captureException(error as Error, {
        context: '2fa_verification',
        userId,
      });
      return { success: false, message: 'Failed to enable 2FA' };
    }
  }

  // Verify TOTP code during login
  async verifyTOTPCode(secret: string, code: string): Promise<boolean> {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeWindow = 1; // Allow 1 window before/after current time
      
      // Check current time and adjacent windows
      for (let i = -timeWindow; i <= timeWindow; i++) {
        const time = currentTime + i;
        const expectedCode = this.generateTOTPCode(secret, time);
        if (expectedCode === code) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to verify TOTP code:', error);
      return false;
    }
  }

  // Generate TOTP code for given time
  private generateTOTPCode(secret: string, time: number): string {
    try {
      const period = 30; // 30 seconds
      const timeCounter = Math.floor(time / period);
      
      // Convert secret to bytes
      const secretBytes = this.base32Decode(secret);
      
      // Create HMAC-SHA1 hash
      const timeBytes = this.intToBytes(timeCounter);
      const hash = this.hmacSha1(secretBytes, timeBytes);
      
      // Extract dynamic truncation
      const offset = hash[hash.length - 1] & 0x0f;
      const code = ((hash[offset] & 0x7f) << 24) |
                   ((hash[offset + 1] & 0xff) << 16) |
                   ((hash[offset + 2] & 0xff) << 8) |
                   (hash[offset + 3] & 0xff);
      
      // Generate 6-digit code
      const totpCode = (code % 1000000).toString().padStart(6, '0');
      
      return totpCode;
    } catch (error) {
      console.error('Failed to generate TOTP code:', error);
      throw error;
    }
  }

  // Verify 2FA during authentication
  async verify2FA(userId: string, code: string): Promise<VerificationResult> {
    try {
      const setup = await secureStorageService.getItem<TwoFactorSetup>(this.STORAGE_KEY);
      if (!setup || !setup.isEnabled) {
        return { success: false };
      }

      // Check if account is locked
      const lockoutKey = `${this.STORAGE_KEY}_lockout`;
      const lockoutInfo = await secureStorageService.getItem<{ attempts: number; lockedUntil: number }>(lockoutKey);
      
      if (lockoutInfo && lockoutInfo.lockedUntil > Date.now()) {
        return {
          success: false,
          lockedUntil: lockoutInfo.lockedUntil,
          remainingAttempts: 0,
        };
      }

      // Verify TOTP code
      if (setup.totpSecret) {
        const isValidTOTP = await this.verifyTOTPCode(setup.totpSecret, code);
        if (isValidTOTP) {
          await this.clearLockout(userId);
          await this.updateLastUsed();
          
          await analyticsService.trackEvent('2fa_verification_success', {
            userId,
            method: 'totp',
            timestamp: Date.now(),
          });
          
          return { success: true, code };
        }
      }

      // Check backup codes
      const backupCodeUsed = await this.verifyBackupCode(setup, code);
      if (backupCodeUsed) {
        await this.clearLockout(userId);
        await this.updateLastUsed();
        
        await analyticsService.trackEvent('2fa_verification_success', {
          userId,
          method: 'backup_code',
          timestamp: Date.now(),
        });
        
        return { success: true, code, backupCodeUsed: true };
      }

      // Increment failed attempts
      const attempts = await this.incrementFailedAttempts(userId);
      const remainingAttempts = Math.max(0, this.MAX_ATTEMPTS - attempts);
      
      if (attempts >= this.MAX_ATTEMPTS) {
        await this.lockAccount(userId);
        return {
          success: false,
          remainingAttempts: 0,
          lockedUntil: Date.now() + this.LOCKOUT_DURATION,
        };
      }

      await analyticsService.trackEvent('2fa_verification_failed', {
        userId,
        attempts,
        remainingAttempts,
        timestamp: Date.now(),
      });

      return { success: false, remainingAttempts };
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
      crashReportingService.captureException(error as Error, {
        context: '2fa_verification',
        userId,
      });
      return { success: false };
    }
  }

  // Verify backup code
  private async verifyBackupCode(setup: TwoFactorSetup, code: string): Promise<boolean> {
    const backupCode = setup.backupCodes.find(bc => bc.code === code && !bc.used);
    
    if (backupCode) {
      backupCode.used = true;
      await secureStorageService.setItem(this.STORAGE_KEY, setup, true);
      return true;
    }
    
    return false;
  }

  // Generate backup codes
  private generateBackupCodes(): BackupCode[] {
    const codes: BackupCode[] = [];
    
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      const code = this.generateRandomCode(this.BACKUP_CODE_LENGTH);
      codes.push({
        code,
        used: false,
        createdAt: Date.now(),
      });
    }
    
    return codes;
  }

  // Generate random code
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  // Generate QR code URL
  private generateQRCodeUrl(config: TOTPConfig): string {
    const encodedSecret = encodeURIComponent(config.secret);
    const encodedIssuer = encodeURIComponent(config.issuer);
    const encodedAccountName = encodeURIComponent(config.accountName);
    
    return `otpauth://totp/${encodedIssuer}:${encodedAccountName}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=${config.algorithm}&digits=${config.digits}&period=${config.period}`;
  }

  // Base32 encoding
  private base32Encode(bytes: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;
    
    for (let i = 0; i < bytes.length; i++) {
      value = (value << 8) | bytes[i];
      bits += 8;
      
      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    
    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }
    
    return result;
  }

  // Base32 decoding
  private base32Decode(str: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes: number[] = [];
    let bits = 0;
    let value = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i].toUpperCase();
      const index = alphabet.indexOf(char);
      
      if (index === -1) continue;
      
      value = (value << 5) | index;
      bits += 5;
      
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    
    return new Uint8Array(bytes);
  }

  // HMAC-SHA1 implementation (simplified)
  private hmacSha1(key: Uint8Array, data: Uint8Array): Uint8Array {
    // In a real implementation, you would use a proper HMAC-SHA1 library
    // This is a placeholder implementation
    const combined = new Uint8Array(key.length + data.length);
    combined.set(key);
    combined.set(data, key.length);
    
    // Simulate SHA1 hash (replace with actual SHA1 implementation)
    const hash = Crypto.digestString(
      Crypto.CryptoDigestAlgorithm.SHA1,
      combined.toString(),
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    
    // Convert base64 to bytes (simplified)
    return new Uint8Array(20); // SHA1 produces 20 bytes
  }

  // Integer to bytes
  private intToBytes(value: number): Uint8Array {
    const bytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      bytes[i] = value & 0xff;
      value >>>= 8;
    }
    return bytes;
  }

  // Increment failed attempts
  private async incrementFailedAttempts(userId: string): Promise<number> {
    const lockoutKey = `${this.STORAGE_KEY}_lockout`;
    const lockoutInfo = await secureStorageService.getItem<{ attempts: number; lockedUntil: number }>(lockoutKey) || {
      attempts: 0,
      lockedUntil: 0,
    };
    
    lockoutInfo.attempts += 1;
    await secureStorageService.setItem(lockoutKey, lockoutInfo, true);
    
    return lockoutInfo.attempts;
  }

  // Clear lockout
  private async clearLockout(userId: string): Promise<void> {
    const lockoutKey = `${this.STORAGE_KEY}_lockout`;
    await secureStorageService.removeItem(lockoutKey);
  }

  // Lock account
  private async lockAccount(userId: string): Promise<void> {
    const lockoutKey = `${this.STORAGE_KEY}_lockout`;
    const lockoutInfo = {
      attempts: this.MAX_ATTEMPTS,
      lockedUntil: Date.now() + this.LOCKOUT_DURATION,
    };
    
    await secureStorageService.setItem(lockoutKey, lockoutInfo, true);
    
    await analyticsService.trackEvent('2fa_account_locked', {
      userId,
      lockoutDuration: this.LOCKOUT_DURATION,
      timestamp: Date.now(),
    });
  }

  // Update last used timestamp
  private async updateLastUsed(): Promise<void> {
    const setup = await secureStorageService.getItem<TwoFactorSetup>(this.STORAGE_KEY);
    if (setup) {
      setup.lastUsed = Date.now();
      await secureStorageService.setItem(this.STORAGE_KEY, setup, true);
    }
  }

  // Disable 2FA
  async disable2FA(userId: string, confirmationCode: string): Promise<{ success: boolean; message?: string }> {
    try {
      const setup = await secureStorageService.getItem<TwoFactorSetup>(this.STORAGE_KEY);
      if (!setup || !setup.isEnabled) {
        return { success: false, message: '2FA is not enabled' };
      }

      // Verify current code before disabling
      const isValid = await this.verify2FA(userId, confirmationCode);
      if (!isValid.success) {
        return { success: false, message: 'Invalid confirmation code' };
      }

      // Disable 2FA
      await secureStorageService.removeItem(this.STORAGE_KEY);
      await secureStorageService.removeItem(`${this.STORAGE_KEY}_lockout`);

      await analyticsService.trackEvent('2fa_disabled', {
        userId,
        timestamp: Date.now(),
      });

      return { success: true, message: 'Two-factor authentication disabled' };
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      crashReportingService.captureException(error as Error, {
        context: '2fa_disable',
        userId,
      });
      return { success: false, message: 'Failed to disable 2FA' };
    }
  }

  // Get 2FA status
  async get2FAStatus(): Promise<{
    isEnabled: boolean;
    backupCodesRemaining: number;
    lastUsed?: number;
  }> {
    try {
      const setup = await secureStorageService.getItem<TwoFactorSetup>(this.STORAGE_KEY);
      if (!setup) {
        return { isEnabled: false, backupCodesRemaining: 0 };
      }

      return {
        isEnabled: setup.isEnabled,
        backupCodesRemaining: setup.backupCodes.filter(bc => !bc.used).length,
        lastUsed: setup.lastUsed,
      };
    } catch (error) {
      console.error('Failed to get 2FA status:', error);
      return { isEnabled: false, backupCodesRemaining: 0 };
    }
  }

  // Regenerate backup codes
  async regenerateBackupCodes(userId: string, confirmationCode: string): Promise<{
    success: boolean;
    backupCodes?: string[];
    message?: string;
  }> {
    try {
      const setup = await secureStorageService.getItem<TwoFactorSetup>(this.STORAGE_KEY);
      if (!setup || !setup.isEnabled) {
        return { success: false, message: '2FA is not enabled' };
      }

      // Verify current code
      const isValid = await this.verify2FA(userId, confirmationCode);
      if (!isValid.success) {
        return { success: false, message: 'Invalid confirmation code' };
      }

      // Generate new backup codes
      const newBackupCodes = this.generateBackupCodes();
      setup.backupCodes = newBackupCodes;
      
      await secureStorageService.setItem(this.STORAGE_KEY, setup, true);

      await analyticsService.trackEvent('2fa_backup_codes_regenerated', {
        userId,
        timestamp: Date.now(),
      });

      return {
        success: true,
        backupCodes: newBackupCodes.map(bc => bc.code),
        message: 'Backup codes regenerated successfully',
      };
    } catch (error) {
      console.error('Failed to regenerate backup codes:', error);
      return { success: false, message: 'Failed to regenerate backup codes' };
    }
  }

  // Cleanup
  destroy(): void {
    this.isInitialized = false;
    console.log('Two-factor authentication service destroyed');
  }
}

export const twoFactorAuthService = new TwoFactorAuthService();
