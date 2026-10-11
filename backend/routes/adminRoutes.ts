import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  updateEventStatus,
  getAllRegistrations
} from '../controllers/adminController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all admin routes
router.use(authenticate, authorizeRoles('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.patch('/events/:id/status', updateEventStatus);
router.get('/registrations', getAllRegistrations);

export default router;
