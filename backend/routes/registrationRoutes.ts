import { Router } from 'express';
import {
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
  updateFormStatus,
} from '../controllers/registrationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Student registers for an event
router.post('/', authenticate, registerForEvent);

// Student views their own registrations
router.get('/my', authenticate, getMyRegistrations);

// Student updates their Google Form completed status
router.patch('/:id/form-status', authenticate, updateFormStatus);

// Student or Admin cancels a registration
router.delete('/:id', authenticate, cancelRegistration);

export default router;

