import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { dislikedItemsController } from '../controllers/dislikedItems.controller.js';
const dislikedItemsRoutes = Router();
// Añadir un item a "no me interesa"
dislikedItemsRoutes.post('/', authMiddleware, asyncHandler(dislikedItemsController.addDislikedItem));
// Eliminar un item de "no me interesa"
dislikedItemsRoutes.delete('/:type/:id', authMiddleware, asyncHandler(dislikedItemsController.removeDislikedItem));
// Obtener todos los items de "no me interesa"
dislikedItemsRoutes.get('/', authMiddleware, asyncHandler(dislikedItemsController.getDislikedItems));
export default dislikedItemsRoutes;
