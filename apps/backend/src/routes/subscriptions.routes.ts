import { Router } from 'express';
import { subscriptionsController } from '../controllers/subscriptions.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/plans', subscriptionsController.getPlans);

// Protected routes (authenticated users)
router.get('/current', protect, authorize(['USER', 'ORGANIZER', 'ADMIN']), subscriptionsController.getUserSubscription);
router.post('/create', protect, authorize(['USER', 'ORGANIZER', 'ADMIN']), subscriptionsController.createSubscription);
router.post('/upgrade/:subscriptionId', protect, authorize(['USER', 'ORGANIZER', 'ADMIN']), subscriptionsController.upgradeSubscription);
router.post('/cancel/:subscriptionId', protect, authorize(['USER', 'ORGANIZER', 'ADMIN']), subscriptionsController.cancelSubscription);
router.get('/usage', protect, authorize(['USER', 'ORGANIZER', 'ADMIN']), subscriptionsController.getCurrentUsage);
router.get('/permissions/event-creation', protect, authorize(['USER', 'ORGANIZER', 'ADMIN']), subscriptionsController.checkEventCreationPermission);

// Tracking routes
router.post('/track/event-creation', protect, authorize(['ORGANIZER', 'ADMIN']), subscriptionsController.trackEventCreation);
router.post('/track/ticket-sales', protect, authorize(['ORGANIZER', 'ADMIN']), subscriptionsController.trackTicketSales);
router.post('/track/api-usage', protect, authorize(['ORGANIZER', 'ADMIN']), subscriptionsController.trackApiUsage);

// Admin routes
router.get('/analytics', protect, authorize(['ADMIN']), subscriptionsController.getSubscriptionAnalytics);

// System routes (called by payment callbacks)
router.post('/activate/:subscriptionId', subscriptionsController.activateSubscription);
router.post('/renew/:subscriptionId', subscriptionsController.processRenewal);

export default router;