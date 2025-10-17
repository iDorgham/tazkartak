import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.config';
import redisClient from '../config/redis.config';
import { config as appConfig } from '../config/app.config';
import { 
  User, 
  UserRole, 
  RefreshToken,
  Organizer,
  Venue 
} from '@prisma/client';
import { logger } from '../utils/logger.util';
import { sendPasswordResetEmail, sendWelcomeEmail, sendEmailVerificationEmail } from '../utils/email.util';
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

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, appConfig.bcryptRounds);

      // Create user with transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: data.email,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            role: data.role,
          },
        });

        // Create role-specific profile
        if (data.role === UserRole.ORGANIZER) {
          await tx.organizer.create({
            data: {
              userId: user.id,
              name: `${data.firstName} ${data.lastName}`,
              description: '',
              contactEmail: data.email,
            },
          });
        } else if (data.role === UserRole.VENUE_OWNER) {
          await tx.venue.create({
            data: {
              userId: user.id,
              name: `${data.firstName} ${data.lastName}`,
              location: '',
              capacity: 0,
              contactEmail: data.email,
            },
          });
        }

        return user;
      });

      // Generate tokens
      const tokens = await this.generateTokens(result);

      // Store refresh token
      await this.storeRefreshToken(result.id, tokens.refreshToken);

      // Remove password from response
      const { password, ...userWithoutPassword } = result;

      logger.info(`User registered successfully: ${result.email}`);

      // Send welcome email
      try {
        await sendWelcomeEmail(result.email, result.firstName || undefined);
        logger.info(`Welcome email sent to ${result.email}`);
      } catch (error) {
        logger.error('Failed to send welcome email:', error);
        // Don't fail registration if email fails
      }

      return {
        token: tokens.accessToken,
        user: userWithoutPassword,
        message: 'Registration successful'
      };
    } catch (error: any) {
      logger.error('Registration failed:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Find user with role-specific data
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
        include: {
          organizer: true,
          venueOwner: true,
        },
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated. Please contact support.');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Store refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      logger.info(`User logged in successfully: ${user.email}`);

      return {
        token: tokens.accessToken,
        user: userWithoutPassword,
        message: 'Login successful'
      };
    } catch (error: any) {
      logger.error('Login failed:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, appConfig.refreshTokenSecret) as any;
      
      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          organizer: true,
          venueOwner: true,
        },
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update refresh token
      await this.updateRefreshToken(refreshToken, tokens.refreshToken);

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return {
        token: tokens.accessToken,
        user: userWithoutPassword
      };
    } catch (error: any) {
      logger.error('Token refresh failed:', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  static async logout(refreshToken: string): Promise<void> {
    try {
      // Remove refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });

      logger.info('User logged out successfully');
    } catch (error: any) {
      logger.error('Logout failed:', error);
      throw new Error('Logout failed');
    }
  }

  /**
   * Logout from all devices
   */
  static async logoutAllDevices(userId: string): Promise<void> {
    try {
      // Remove all refresh tokens for user
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });

      logger.info(`User logged out from all devices: ${userId}`);
    } catch (error: any) {
      logger.error('Logout all devices failed:', error);
      throw new Error('Logout failed');
    }
  }

  /**
   * Forgot password
   */
  static async forgotPassword(data: ForgotPasswordData): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (!user) {
        // Don't reveal if email exists or not
        return;
      }

      // Generate reset token
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token in Redis
      await redisClient.setEx(
        `password_reset:${resetToken}`,
        3600, // 1 hour TTL
        JSON.stringify({
          userId: user.id,
          email: user.email,
          expiresAt: expiresAt.toISOString()
        })
      );

      // Send password reset email
      try {
        await sendPasswordResetEmail(user.email, resetToken, user.firstName || undefined);
        logger.info(`Password reset email sent to ${user.email}`);
      } catch (error) {
        logger.error('Failed to send password reset email:', error);
        throw new Error('Failed to send password reset email');
      }

    } catch (error: any) {
      logger.error('Forgot password failed:', error);
      throw new Error('Failed to process password reset request');
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      // Get reset token from Redis
      const tokenData = await redisClient.get(`password_reset:${data.token}`);
      
      if (!tokenData) {
        throw new Error('Invalid or expired reset token');
      }

      const { userId, expiresAt } = JSON.parse(tokenData);

      if (new Date(expiresAt) < new Date()) {
        throw new Error('Reset token has expired');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(data.password, appConfig.bcryptRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Remove reset token
      await redisClient.del(`password_reset:${data.token}`);

      // Invalidate all refresh tokens for security
      await this.logoutAllDevices(userId);

      logger.info(`Password reset successful for user: ${userId}`);
    } catch (error: any) {
      logger.error('Password reset failed:', error);
      throw new Error(error.message || 'Password reset failed');
    }
  }

  /**
   * Change password (authenticated user)
   */
  static async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(data.newPassword, appConfig.bcryptRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Invalidate all refresh tokens for security
      await this.logoutAllDevices(userId);

      logger.info(`Password changed successfully for user: ${userId}`);
    } catch (error: any) {
      logger.error('Password change failed:', error);
      throw new Error(error.message || 'Password change failed');
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: UpdateProfileData): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
        },
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      logger.info(`Profile updated successfully for user: ${userId}`);

      return userWithoutPassword as User;
    } catch (error: any) {
      logger.error('Profile update failed:', error);
      throw new Error('Profile update failed');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private static async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, appConfig.jwtSecret, {
      expiresIn: appConfig.jwtExpiresIn,
    });

    const refreshToken = jwt.sign(payload, appConfig.refreshTokenSecret, {
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }

  /**
   * Store refresh token in database
   */
  private static async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });
  }

  /**
   * Update refresh token
   */
  private static async updateRefreshToken(oldToken: string, newToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.refreshToken.update({
      where: { token: oldToken },
      data: {
        token: newToken,
        expiresAt,
      },
    });
  }

  /**
   * Verify access token
   */
  static async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, appConfig.jwtSecret);
    } catch (error: any) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Get user by ID with role-specific data
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          organizer: true,
          venueOwner: true,
        },
      });

      if (!user) {
        return null;
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error: any) {
      logger.error('Get user failed:', error);
      throw new Error('Failed to get user');
    }
  }
}
