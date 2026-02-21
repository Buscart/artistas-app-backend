import { Router } from 'express';
import { getProfileReviews, getMyReviews } from '../controllers/profile.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Obtener reseñas de un perfil
router.get('/:id/reviews', authMiddleware, getProfileReviews);

// Obtener mis reseñas (usuario autenticado)
router.get('/me/reviews', authMiddleware, getMyReviews);

export default router;
