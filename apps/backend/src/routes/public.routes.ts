import { Router } from 'express';
import { publicController } from '../controllers/public.controller';
import { 
  authenticateApiKey, 
  rateLimitApiKey, 
  requirePermission,
  trackApiUsage 
} from '../middleware/apiAuth.middleware';

const router = Router();

// Apply rate limiting to all public API routes
router.use(rateLimitApiKey);

// Apply API usage tracking to all public API routes
router.use(trackApiUsage);

// Event endpoints
router.get('/events', authenticateApiKey, publicController.getPublicEvents);
router.get('/events/:id', authenticateApiKey, publicController.getEventById);
router.get('/events/:id/tickets', authenticateApiKey, publicController.getEventTickets);

// Ticket purchase (requires API key)
router.post('/tickets/purchase', 
  authenticateApiKey, 
  requirePermission('tickets:write'),
  publicController.purchaseTickets
);

// Ticket details (requires API key)
router.get('/tickets/:id', 
  authenticateApiKey, 
  requirePermission('tickets:read'),
  publicController.getTicketDetails
);

// QR code validation (requires API key)
router.post('/qr/validate', 
  authenticateApiKey, 
  requirePermission('tickets:read'),
  publicController.validateQRCode
);

// Payment methods (public endpoint)
router.get('/payment-methods', publicController.getPaymentMethods);

// Health and info endpoints (public)
router.get('/health', publicController.getHealth);
router.get('/version', publicController.getVersion);
router.get('/docs', publicController.getApiDocs);

export default router;
