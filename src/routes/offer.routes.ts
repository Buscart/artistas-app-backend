import { Router } from 'express';
import { createOffer } from '../controllers/offer.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Crear una nueva oferta
router.post('/', authMiddleware, createOffer);

export default router;
