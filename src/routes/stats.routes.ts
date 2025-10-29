import { Router } from 'express';
import { statsController } from '../controllers/stats.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Ruta para obtener estadísticas del perfil del usuario
router.get('/user/profile/stats', authMiddleware, statsController.getUserStats);

export default router;
