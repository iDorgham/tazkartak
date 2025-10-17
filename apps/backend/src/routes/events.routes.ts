import { Router } from 'express';
import { protect, authorize, checkPermission } from '../middleware/auth.middleware';
import { eventsController } from '../controllers/events.controller';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/public', eventsController.getPublicEvents);
router.get('/search', eventsController.searchEvents);
router.get('/categories', eventsController.getEventCategories);
router.get('/:id', eventsController.getEventById);

// Protected routes
router.use(protect);

// Organizer routes
router.post('/', 
  authorize(UserRole.ORGANIZER, UserRole.ADMIN),
  checkPermission('create', 'events'),
  eventsController.createEvent
);

router.get('/', eventsController.getEvents);

router.put('/:id', 
  authorize(UserRole.ORGANIZER, UserRole.ADMIN),
  checkPermission('update', 'events'),
  eventsController.updateEvent
);

router.delete('/:id', 
  authorize(UserRole.ORGANIZER, UserRole.ADMIN),
  checkPermission('delete', 'events'),
  eventsController.deleteEvent
);

router.patch('/:id/publish', 
  authorize(UserRole.ORGANIZER, UserRole.ADMIN),
  checkPermission('publish', 'events'),
  eventsController.publishEvent
);

router.patch('/:id/cancel', 
  authorize(UserRole.ORGANIZER, UserRole.ADMIN),
  checkPermission('cancel', 'events'),
  eventsController.cancelEvent
);

router.get('/organizer/my-events', 
  authorize(UserRole.ORGANIZER, UserRole.ADMIN),
  eventsController.getEventsByOrganizer
);

router.get('/:id/stats', 
  authorize(UserRole.ORGANIZER, UserRole.ADMIN),
  checkPermission('read', 'analytics'),
  eventsController.getEventStats
);

export default router;
