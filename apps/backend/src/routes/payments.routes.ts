import { Router } from 'express';
import { paymentsController } from '../controllers/payments.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Payment routes
router.get('/methods', paymentsController.getPaymentMethods);
router.get('/history', protect, authorize(['USER', 'ORGANIZER', 'ADMIN']), paymentsController.getPaymentHistory);
router.get('/:paymentId', protect, authorize(['USER', 'ORGANIZER', 'ADMIN']), paymentsController.getPaymentDetails);
router.get('/status/:paymentId', protect, authorize(['USER', 'ORGANIZER', 'ADMIN']), paymentsController.getPaymentStatus);
router.post('/initiate', protect, authorize(['USER', 'ORGANIZER', 'ADMIN']), paymentsController.initiatePayment);
router.post('/refund/:paymentId', protect, authorize(['ORGANIZER', 'ADMIN']), paymentsController.processRefund);

// Callback routes (no auth required - called by payment gateways)
router.post('/callback/paymob', paymentsController.handlePayMobCallback);
router.post('/callback/fawry', paymentsController.handleFawryCallback);

// Webhook routes (no auth required - called by payment gateways)
router.post('/webhook/:gateway', paymentsController.handleWebhook);

export default router;
