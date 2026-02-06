import { Request, Response } from 'express';
import { favoritesService } from '../services/favorites.service.js';

export const favoritesController = {
  addFavorite: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { type, id } = req.body;
    const favorite = await favoritesService.addFavorite(userId, type, id);
    res.status(201).json(favorite);
  },

  removeFavorite: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { type, id } = req.params;
    await favoritesService.removeFavorite(userId, type, parseInt(id));
    res.status(204).send();
  },

  getFavorites: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const favorites = await favoritesService.getFavorites(userId);
    res.status(200).json(favorites);
  },

  // Nuevo endpoint que devuelve solo los IDs agrupados por tipo
  getFavoriteIds: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const favorites = await favoritesService.getFavorites(userId);

    // Agrupar por tipo de entidad
    const grouped = favorites.reduce<Record<string, Set<number>>>((acc, fav) => {
      const entityType = String((fav as any).entityType);
      const entityId = Number((fav as any).entityId);

      if (!acc[entityType]) {
        acc[entityType] = new Set<number>();
      }
      acc[entityType].add(entityId);
      return acc;
    }, {});

    const result = Object.fromEntries(
      Object.entries(grouped).map(([key, value]) => [key, Array.from(value)])
    );

    res.status(200).json(result);
  },

  // Limpiar duplicados de favoritos del usuario
  cleanupDuplicates: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await favoritesService.cleanupDuplicates(userId);
    res.status(200).json({ message: 'Duplicados eliminados', ...result });
  },
};
