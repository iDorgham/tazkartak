import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { requireAdmin, requireRole } from '../middleware/auth.middleware';

const router = Router();

// User routes
router.get('/', requireAdmin, usersController.getUsers);
router.get('/:id', usersController.getUserById);
router.put('/:id', usersController.updateUser);
router.delete('/:id', requireAdmin, usersController.deleteUser);
router.post('/:id/activate', requireAdmin, usersController.activateUser);
router.post('/:id/suspend', requireAdmin, usersController.suspendUser);
router.post('/:id/change-role', requireAdmin, usersController.changeUserRole);

export default router;
