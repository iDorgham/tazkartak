import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@types/auth.types';
import { AuthService } from '@services/auth.service';
import { 
  LoginCredentials, 
  RegisterData, 
  ForgotPasswordData, 
  ResetPasswordData,
  ChangePasswordData,
  UpdateProfileData 
} from '@types/auth.types';
import { ApiResponse } from '../types/api.types';
import logger from '@utils/logger.util';

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const registerData: RegisterData = req.body;
      
      const result = await AuthService.register(registerData);
      
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result
      } as ApiResponse);
    } catch (error: any) {
      logger.error('Registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
        errors: [error.message]
      } as ApiResponse);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const credentials: LoginCredentials = req.body;
      
      const result = await AuthService.login(credentials);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      } as ApiResponse);
    } catch (error: any) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
        errors: [error.message]
      } as ApiResponse);
    }
  },

  refreshToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        } as ApiResponse);
      }
      
      const result = await AuthService.refreshToken(refreshToken);
      
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      } as ApiResponse);
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed'
      } as ApiResponse);
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'] as string;
      
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
      
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      } as ApiResponse);
    } catch (error: any) {
      logger.error('Logout error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Logout failed'
      } as ApiResponse);
    }
  },

  logoutAllDevices: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        } as ApiResponse);
      }
      
      await AuthService.logoutAllDevices(req.user.id);
      
      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully'
      } as ApiResponse);
    } catch (error: any) {
      logger.error('Logout all devices error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Logout failed'
      } as ApiResponse);
    }
  },

  getMe: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        } as ApiResponse);
      }
      
      const user = await AuthService.getUserById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        } as ApiResponse);
      }
      
      res.status(200).json({
        success: true,
        data: { user }
      } as ApiResponse);
    } catch (error: any) {
      logger.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user data'
      } as ApiResponse);
    }
  },

  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: ForgotPasswordData = req.body;
      
      await AuthService.forgotPassword(data);
      
      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      } as ApiResponse);
    } catch (error: any) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request'
      } as ApiResponse);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: ResetPasswordData = req.body;
      
      await AuthService.resetPassword(data);
      
      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      } as ApiResponse);
    } catch (error: any) {
      logger.error('Reset password error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Password reset failed'
      } as ApiResponse);
    }
  },

  changePassword: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        } as ApiResponse);
      }
      
      const data: ChangePasswordData = req.body;
      
      await AuthService.changePassword(req.user.id, data);
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      } as ApiResponse);
    } catch (error: any) {
      logger.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Password change failed'
      } as ApiResponse);
    }
  },

  updateProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        } as ApiResponse);
      }
      
      const data: UpdateProfileData = req.body;
      
      const user = await AuthService.updateProfile(req.user.id, data);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      } as ApiResponse);
    } catch (error: any) {
      logger.error('Update profile error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Profile update failed'
      } as ApiResponse);
    }
  },

  verifyEmail: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Implement email verification logic
      res.status(200).json({
        success: true,
        message: 'Email verification endpoint - to be implemented',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  },

  resendVerification: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Implement resend verification logic
      res.status(200).json({
        success: true,
        message: 'Resend verification endpoint - to be implemented',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  },
};
