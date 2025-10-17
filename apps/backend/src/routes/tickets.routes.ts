import { Router } from 'express';
import { ticketsController } from '../controllers/tickets.controller';

const router = Router();

// Ticket routes
router.get('/', ticketsController.getTickets);
router.get('/:id', ticketsController.getTicketById);
router.post('/purchase', ticketsController.purchaseTickets);
router.post('/:id/validate', ticketsController.validateTicket);
router.put('/:id/use', ticketsController.useTicket);
router.post('/:id/refund', ticketsController.refundTicket);
router.post('/:id/transfer', ticketsController.transferTicket);

export default router;
