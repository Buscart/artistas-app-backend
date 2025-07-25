import { Router } from 'express';
import { getProfileReviews } from '../controllers/profile.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Obtener reseñas de un perfil
router.get('/:id/reviews', authMiddleware, getProfileReviews);

export default router;
