import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Webhook management routes (require authentication)
router.use('/manage', protect);
router.use('/manage', authorize(['ORGANIZER', 'ADMIN']));

// Webhook CRUD operations
router.post('/manage', webhookController.createWebhook);
router.get('/manage', webhookController.getWebhooks);
router.get('/manage/stats', webhookController.getWebhookStats);
router.get('/manage/events', webhookController.getValidEvents);

// Individual webhook operations
router.get('/manage/:id', webhookController.getWebhookById);
router.put('/manage/:id', webhookController.updateWebhook);
router.delete('/manage/:id', webhookController.deleteWebhook);
router.post('/manage/:id/test', webhookController.testWebhook);
router.get('/manage/:id/logs', webhookController.getWebhookLogs);
router.post('/manage/:id/retry', webhookController.retryWebhookDelivery);

// External webhook endpoints (no auth required - called by external services)
router.post('/receive/:webhookId', webhookController.receiveWebhook);

export default router;
