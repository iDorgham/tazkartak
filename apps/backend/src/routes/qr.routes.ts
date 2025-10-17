import { Router } from 'express';
import { qrController } from '../controllers/qr.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// QR Code routes
router.post('/generate/:ticketId', protect, authorize(['ORGANIZER', 'ADMIN']), qrController.generateQRCode);
router.post('/validate', protect, authorize(['ORGANIZER', 'ADMIN']), qrController.validateQRCode);
router.post('/info', protect, authorize(['ORGANIZER', 'ADMIN']), qrController.getQRCodeInfo);
router.get('/history/:ticketId', protect, authorize(['ORGANIZER', 'ADMIN']), qrController.getScanHistory);
router.post('/invalidate/:ticketId', protect, authorize(['ORGANIZER', 'ADMIN']), qrController.invalidateQRCode);
router.get('/stats/:eventId', protect, authorize(['ORGANIZER', 'ADMIN']), qrController.getQRStats);
router.post('/bulk-validate', protect, authorize(['ORGANIZER', 'ADMIN']), qrController.bulkValidateQRCodes);
router.get('/email/:ticketId', protect, authorize(['ORGANIZER', 'ADMIN']), qrController.generateQRCodeForEmail);

export default router;
