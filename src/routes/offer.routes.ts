import { Router } from 'express';
import { createOffer } from '../controllers/offer.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Crear una nueva oferta
router.post('/', authMiddleware, createOffer);

export default router;
