import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { protect } from '@middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.post('/logout', authController.logout);
router.post('/logout-all-devices', protect, authController.logoutAllDevices);
router.get('/me', protect, authController.getMe);
router.put('/change-password', protect, authController.changePassword);
router.put('/profile', protect, authController.updateProfile);

// Email verification (to be implemented)
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

export default router;
