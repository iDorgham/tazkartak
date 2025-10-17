import { Router } from 'express';
import { protect, authorize, checkPermission } from '../middleware/auth.middleware';
import { venuesController } from '../controllers/venues.controller';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/verified', venuesController.getVerifiedVenues);
router.get('/search', venuesController.searchVenuesByLocation);
router.get('/amenities', venuesController.getAvailableAmenities);
router.get('/cities', venuesController.getCitiesWithVenues);
router.get('/:id', venuesController.getVenueById);

// Protected routes
router.use(protect);

// Venue owner routes
router.post('/', 
  authorize(UserRole.VENUE_OWNER, UserRole.ADMIN),
  checkPermission('create', 'venues'),
  venuesController.createVenue
);

router.get('/', venuesController.getVenues);

router.put('/:id', 
  authorize(UserRole.VENUE_OWNER, UserRole.ADMIN),
  checkPermission('update', 'venues'),
  venuesController.updateVenue
);

router.delete('/:id', 
  authorize(UserRole.VENUE_OWNER, UserRole.ADMIN),
  checkPermission('delete', 'venues'),
  venuesController.deleteVenue
);

router.get('/owner/my-venues', 
  authorize(UserRole.VENUE_OWNER, UserRole.ADMIN),
  venuesController.getVenuesByOwner
);

router.get('/:id/stats', 
  authorize(UserRole.VENUE_OWNER, UserRole.ADMIN),
  checkPermission('read', 'analytics'),
  venuesController.getVenueStats
);

router.post('/:id/upload-images', 
  authorize(UserRole.VENUE_OWNER, UserRole.ADMIN),
  checkPermission('update', 'venues'),
  venuesController.uploadVenueImages
);

// Admin routes
router.get('/admin/pending-verification', 
  authorize(UserRole.ADMIN),
  checkPermission('read', 'venues'),
  venuesController.getPendingVerificationVenues
);

router.post('/:id/verify', 
  authorize(UserRole.ADMIN),
  checkPermission('verify', 'venues'),
  venuesController.verifyVenue
);

export default router;
