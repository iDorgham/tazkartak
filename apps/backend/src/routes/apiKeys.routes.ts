import { Router } from 'express';
import { apiKeyController } from '../controllers/apiKey.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Only organizers and admins can manage API keys
router.use(authorize(['ORGANIZER', 'ADMIN']));

// API key management routes
router.post('/', apiKeyController.createApiKey);
router.get('/', apiKeyController.getApiKeys);
router.get('/stats', apiKeyController.getApiKeyStats);
router.get('/permissions', apiKeyController.getValidPermissions);

// Individual API key routes
router.get('/:id', apiKeyController.getApiKeyById);
router.put('/:id', apiKeyController.updateApiKey);
router.delete('/:id', apiKeyController.deleteApiKey);
router.post('/:id/rotate', apiKeyController.rotateApiKey);
router.get('/:id/usage', apiKeyController.getApiKeyUsage);

export default router;
