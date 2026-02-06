import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { favoritesController } from '../controllers/favorites.controller.js';

const favoritesRoutes = Router();

favoritesRoutes.post(
  '/',
  authMiddleware,
  asyncHandler(favoritesController.addFavorite)
);

favoritesRoutes.delete(
  '/:type/:id',
  authMiddleware,
  asyncHandler(favoritesController.removeFavorite)
);

favoritesRoutes.get(
  '/',
  authMiddleware,
  asyncHandler(favoritesController.getFavorites)
);

favoritesRoutes.get(
  '/ids',
  authMiddleware,
  asyncHandler(favoritesController.getFavoriteIds)
);

favoritesRoutes.post(
  '/cleanup',
  authMiddleware,
  asyncHandler(favoritesController.cleanupDuplicates)
);

export default favoritesRoutes;
