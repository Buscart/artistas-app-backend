import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Ruta para obtener estadísticas del dashboard
router.get('/stats', authMiddleware, dashboardController.getStats);

export default router;
