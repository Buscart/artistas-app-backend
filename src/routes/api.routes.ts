
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { artistController } from '../controllers/artist.controller';
import { venueController } from '../controllers/venue.controller';

const router = Router();

// Auth routes
router.post('/auth/login', authController.login);
router.get('/auth/user', authController.getUser);

// Artist routes
router.get('/artists', artistController.getAll);
router.get('/artists/:id', artistController.getById);

// Venue routes
router.get('/venues', venueController.getAll);
router.get('/venues/:id', venueController.getById);

export default router;
